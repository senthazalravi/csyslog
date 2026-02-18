import { AIProvider, DeviceFailure } from "@/types/ai-settings";

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  modelResponse?: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export interface OllamaModelPullProgress {
  status: string;           // e.g. "pulling manifest", "downloading …", "verifying …"
  percent: number;          // 0–100, -1 when indeterminate
  completedBytes?: number;
  totalBytes?: number;
}

// Resolve Ollama base URL – use the Vite dev-server proxy in dev to avoid CORS
const getOllamaProxyUrl = (provider: AIProvider): string => {
  if (import.meta.env.DEV) {
    return "/ollama-api";
  }
  return provider.baseUrl || "http://localhost:11434";
};

// Resolve NVIDIA base URL – use the Vite dev-server proxy in dev to avoid CORS
const getNvidiaProxyUrl = (provider: AIProvider): string => {
  if (import.meta.env.DEV) {
    return "/nvidia-api";
  }
  return provider.baseUrl || "https://integrate.api.nvidia.com/v1";
};

// ─── Check whether a model is already available locally ──────────────────────
const isModelAvailable = async (proxyUrl: string, modelName: string): Promise<boolean> => {
  try {
    const res = await fetch(`${proxyUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const models: { name: string }[] = data.models || [];
    // Ollama lists models as "name:tag"; user may omit :latest
    return models.some(
      (m) =>
        m.name === modelName ||
        m.name === `${modelName}:latest` ||
        m.name.startsWith(`${modelName}:`)
    );
  } catch {
    return false;
  }
};

// ─── Pull a model from Ollama (streams progress) ────────────────────────────
export const pullOllamaModel = async (
  provider: AIProvider,
  onProgress?: (progress: OllamaModelPullProgress) => void
): Promise<{ success: boolean; error?: string }> => {
  const proxyUrl = getOllamaProxyUrl(provider);
  const model = provider.model || "gpt-oss:20b";

  onProgress?.({ status: `Pulling model "${model}"…`, percent: 0 });

  try {
    const res = await fetch(`${proxyUrl}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: model, stream: true }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Pull failed (${res.status}): ${errText.slice(0, 200)}`,
      };
    }

    const reader = res.body?.getReader();
    if (!reader) return { success: false, error: "No response stream from Ollama" };

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          const status: string = json.status || "";
          let percent = -1;
          if (json.total && json.completed) {
            percent = Math.round((json.completed / json.total) * 100);
          }
          onProgress?.({
            status,
            percent,
            completedBytes: json.completed,
            totalBytes: json.total,
          });

          if (status === "success") {
            onProgress?.({ status: "Model pulled successfully", percent: 100 });
            return { success: true };
          }
        } catch {
          // Ignore malformed JSON lines
        }
      }
    }

    onProgress?.({ status: "Pull completed", percent: 100 });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown pull error";
    return { success: false, error: msg };
  }
};

// ─── Test connection to AI provider ─────────────────────────────────────────
export const testConnection = async (
  provider: AIProvider,
  onProgress?: (progress: OllamaModelPullProgress) => void
): Promise<ConnectionTestResult> => {
  const startTime = Date.now();

  try {
    switch (provider.id) {
      case "ollama": {
        const proxyUrl = getOllamaProxyUrl(provider);
        const model = provider.model || "gpt-oss:20b";

        // ── Step 1: Health check ─────────────────────────────
        onProgress?.({ status: "Checking if Ollama is running…", percent: -1 });
        const healthResponse = await fetch(proxyUrl, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });

        if (!healthResponse.ok) {
          throw new Error(`Ollama health check returned ${healthResponse.status}`);
        }

        const healthText = await healthResponse.text();
        if (!healthText.toLowerCase().includes("ollama is running")) {
          throw new Error(
            `Unexpected response from Ollama: ${healthText.slice(0, 100)}`
          );
        }

        // ── Step 2: Check model / auto-pull ──────────────────
        onProgress?.({ status: `Checking model "${model}"…`, percent: -1 });
        const modelExists = await isModelAvailable(proxyUrl, model);

        if (!modelExists) {
          onProgress?.({
            status: `Model "${model}" not found locally – pulling…`,
            percent: 0,
          });
          const pullResult = await pullOllamaModel(provider, onProgress);
          if (!pullResult.success) {
            return {
              success: false,
              message:
                pullResult.error || `Failed to pull model "${model}"`,
              latency: Date.now() - startTime,
            };
          }
        }

        // ── Step 3: Send a real test prompt ──────────────────
        onProgress?.({ status: "Sending test prompt to model…", percent: -1 });
        const chatResponse = await fetch(`${proxyUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [
              { role: "user", content: "Say hello in one sentence." },
            ],
            stream: false,
          }),
          signal: AbortSignal.timeout(60000), // generous timeout after a pull
        });

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          throw new Error(
            `Model "${model}" error: ${chatResponse.status} – ${errorText.slice(0, 150)}`
          );
        }

        const chatData = await chatResponse.json();
        const modelReply =
          chatData.choices?.[0]?.message?.content || "";
        const latency = Date.now() - startTime;

        if (!modelReply) {
          return {
            success: false,
            message: `Ollama is running but model "${model}" returned an empty response.`,
            latency,
          };
        }

        return {
          success: true,
          message: `Ollama is running. Model "${model}" responded successfully.`,
          modelResponse: modelReply.trim(),
          latency,
        };
      }

      case "nvidia": {
        const proxyUrl = getNvidiaProxyUrl(provider);
        const model = provider.model || "moonshotai/kimi-k2.5";

        onProgress?.({ status: "Testing NVIDIA API connection...", percent: -1 });

        const response = await fetch(`${proxyUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${provider.apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: "Ping" }],
            max_tokens: 5
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`NVIDIA error: ${response.status} - ${error.slice(0, 100)}`);
        }

        return {
          success: true,
          message: "Connected to NVIDIA AI API",
          latency: Date.now() - startTime,
        };
      }

      case "openai": {
        const response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: { Authorization: `Bearer ${provider.apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(
            `OpenAI error: ${response.status} - ${error.slice(0, 100)}`
          );
        }
        return {
          success: true,
          message: "Connected to OpenAI API",
          latency: Date.now() - startTime,
        };
      }

      case "grok": {
        const response = await fetch("https://api.x.ai/v1/models", {
          method: "GET",
          headers: { Authorization: `Bearer ${provider.apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(
            `Grok error: ${response.status} - ${error.slice(0, 100)}`
          );
        }
        return {
          success: true,
          message: "Connected to Grok (xAI) API",
          latency: Date.now() - startTime,
        };
      }

      case "deepseek": {
        const baseUrl = provider.baseUrl || "https://api.deepseek.com";
        const response = await fetch(`${baseUrl}/models`, {
          method: "GET",
          headers: { Authorization: `Bearer ${provider.apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const error = await response.text();
          throw new Error(
            `DeepSeek error: ${response.status} - ${error.slice(0, 100)}`
          );
        }
        return {
          success: true,
          message: "Connected to DeepSeek API",
          latency: Date.now() - startTime,
        };
      }

      default:
        return { success: false, message: "Unknown provider" };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection failed";

    if (
      message.includes("Failed to fetch") ||
      message.includes("NetworkError") ||
      message.includes("TimeoutError") ||
      message.includes("timed out")
    ) {
      if (provider.id === "ollama") {
        return {
          success: false,
          message:
            "Cannot reach Ollama. Make sure it's running at http://localhost:11434",
        };
      }
      return {
        success: false,
        message:
          "Network error. CORS may be blocking the request – cloud APIs require a backend proxy.",
      };
    }

    return { success: false, message };
  }
};

// ─── Analyze logs with AI provider (non-streaming) ──────────────────────────
export const analyzeWithAI = async (
  content: string,
  provider: AIProvider,
  onProgress?: (stage: string) => void
): Promise<{
  summary?: string;
  severityBreakdown?: any;
  insights?: string[];
  recommendations?: string[];
  deviceFailures?: DeviceFailure[];
  error?: string;
}> => {
  const systemPrompt = `You are a security and systems log analyst. Analyze the provided log content and return a JSON object with:
- summary: A brief 2-3 sentence summary of the log
- severityBreakdown: Object with counts for critical, warning, info, success
- insights: Array of 3-5 key insights about patterns, anomalies, or issues
- recommendations: Array of 2-4 actionable recommendations

Only return valid JSON, no markdown or explanations.`;

  const truncatedContent = content.slice(0, 15000);

  onProgress?.("Connecting to AI model...");

  try {
    let apiUrl: string;
    let headers: Record<string, string>;
    let body: any;

    switch (provider.id) {
      case "ollama":
        apiUrl = `${getOllamaProxyUrl(provider)}/v1/chat/completions`;
        headers = { "Content-Type": "application/json" };
        body = {
          model: provider.model || "gpt-oss:20b",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyze this log:\n\n${truncatedContent}`,
            },
          ],
          stream: false,
        };
        break;

      case "nvidia":
        apiUrl = `${getNvidiaProxyUrl(provider)}/chat/completions`;
        headers = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${provider.apiKey}`
        };
        body = {
          model: provider.model || "moonshotai/kimi-k2.5",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyze this log:\n\n${truncatedContent}`,
            },
          ],
          stream: false,
        };
        break;

      case "openai":
      case "grok":
      case "deepseek":
        return {
          error: `${provider.name} cannot be called directly from the browser due to CORS restrictions. Please use Ollama for local analysis.`,
        };

      default:
        return { error: "Unknown provider" };
    }

    onProgress?.("Sending log data to AI...");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: `API error: ${response.status} - ${errorText.slice(0, 100)}`,
      };
    }

    onProgress?.("Processing AI response...");

    const data = await response.json();
    const contentResponse =
      data.choices?.[0]?.message?.content || "";

    const jsonMatch = contentResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Could not parse AI response as JSON" };
    }

    onProgress?.("Finalizing report...");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary,
      severityBreakdown: parsed.severityBreakdown,
      insights: parsed.insights,
      recommendations: parsed.recommendations,
      deviceFailures: parsed.deviceFailures,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (
      message.includes("Failed to fetch") ||
      message.includes("NetworkError")
    ) {
      return {
        error:
          "Cannot reach Ollama. Make sure it's running at http://localhost:11434",
      };
    }

    return { error: message };
  }
};

// ─── Streaming analysis for Ollama ──────────────────────────────────────────
export const analyzeWithAIStreaming = async (
  content: string,
  provider: AIProvider,
  onProgress?: (stage: string) => void,
  onStreamChunk?: (chunk: string, fullText: string) => void
): Promise<{
  summary?: string;
  severityBreakdown?: any;
  insights?: string[];
  recommendations?: string[];
  deviceFailures?: DeviceFailure[];
  error?: string;
}> => {
  if (provider.id !== "ollama") {
    return {
      error: `Streaming is only supported for Ollama. ${provider.name} cannot be called directly from the browser.`,
    };
  }

  const systemPrompt = `You are a security and systems log analyst. Analyze the provided log content and return a JSON object with:
- summary: A brief 2-3 sentence summary of the log
- severityBreakdown: Object with counts for critical, warning, info, success
- insights: Array of 3-5 key insights about patterns, anomalies, or issues
- recommendations: Array of 2-4 actionable recommendations

Only return valid JSON, no markdown or explanations.`;

  const truncatedContent = content.slice(0, 15000);

  onProgress?.("Connecting to Ollama...");

  try {
    const apiUrl = `${getOllamaProxyUrl(provider)}/v1/chat/completions`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: provider.model || "gpt-oss:20b",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this log:\n\n${truncatedContent}`,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: `Ollama error: ${response.status} - ${errorText.slice(0, 100)}`,
      };
    }

    onProgress?.("Streaming response from AI...");

    const reader = response.body?.getReader();
    if (!reader) {
      return { error: "Failed to get response stream" };
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim() || line.startsWith(":")) continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            fullText += chunk;
            onStreamChunk?.(chunk, fullText);
          }
        } catch {
          // Ignore parse errors for incomplete JSON
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim() && buffer.startsWith("data: ")) {
      const jsonStr = buffer.slice(6).trim();
      if (jsonStr !== "[DONE]") {
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk = parsed.choices?.[0]?.delta?.content;
          if (chunk) {
            fullText += chunk;
            onStreamChunk?.(chunk, fullText);
          }
        } catch {
          // Ignore
        }
      }
    }

    onProgress?.("Parsing analysis results...");

    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        error:
          "Could not parse AI response as JSON. Raw response: " +
          fullText.slice(0, 200),
      };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      summary: result.summary,
      severityBreakdown: result.severityBreakdown,
      insights: result.insights,
      recommendations: result.recommendations,
      deviceFailures: result.deviceFailures,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    if (
      message.includes("Failed to fetch") ||
      message.includes("NetworkError")
    ) {
      return {
        error:
          "Cannot reach Ollama. Make sure it's running at http://localhost:11434",
      };
    }

    return { error: message };
  }
};
