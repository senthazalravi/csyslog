import { AIProvider } from "@/types/ai-settings";

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

export interface AIResponse {
  content: string;
  error?: string;
}

// Test connection to AI provider
export const testConnection = async (provider: AIProvider): Promise<ConnectionTestResult> => {
  const startTime = Date.now();

  try {
    switch (provider.id) {
      case "ollama": {
        // Ollama uses /api/tags to list models (health check)
        const baseUrl = provider.baseUrl || "http://localhost:11434";
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) {
          throw new Error(`Ollama returned ${response.status}`);
        }
        
        const data = await response.json();
        const latency = Date.now() - startTime;
        const modelCount = data.models?.length || 0;
        
        return {
          success: true,
          message: `Connected to Ollama (${modelCount} models available)`,
          latency,
        };
      }

      case "openai": {
        // OpenAI - test with models endpoint
        const response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${provider.apiKey}`,
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenAI error: ${response.status} - ${error.slice(0, 100)}`);
        }
        
        const latency = Date.now() - startTime;
        return {
          success: true,
          message: "Connected to OpenAI API",
          latency,
        };
      }

      case "grok": {
        // Grok/xAI - test with models endpoint
        const response = await fetch("https://api.x.ai/v1/models", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${provider.apiKey}`,
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Grok error: ${response.status} - ${error.slice(0, 100)}`);
        }
        
        const latency = Date.now() - startTime;
        return {
          success: true,
          message: "Connected to Grok (xAI) API",
          latency,
        };
      }

      case "deepseek": {
        // DeepSeek - test with models endpoint
        const baseUrl = provider.baseUrl || "https://api.deepseek.com";
        const response = await fetch(`${baseUrl}/models`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${provider.apiKey}`,
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`DeepSeek error: ${response.status} - ${error.slice(0, 100)}`);
        }
        
        const latency = Date.now() - startTime;
        return {
          success: true,
          message: "Connected to DeepSeek API",
          latency,
        };
      }

      default:
        return {
          success: false,
          message: "Unknown provider",
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    
    // Provide helpful error messages
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      if (provider.id === "ollama") {
        return {
          success: false,
          message: "Cannot reach Ollama. Make sure it's running at " + (provider.baseUrl || "http://localhost:11434"),
        };
      }
      return {
        success: false,
        message: "Network error. CORS may be blocking the request - cloud APIs require a backend proxy.",
      };
    }
    
    return {
      success: false,
      message,
    };
  }
};

// Analyze logs with AI provider (non-streaming)
export const analyzeWithAI = async (
  content: string,
  provider: AIProvider,
  onProgress?: (stage: string) => void
): Promise<{ summary?: string; severityBreakdown?: any; insights?: string[]; recommendations?: string[]; error?: string }> => {
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
        apiUrl = `${provider.baseUrl || "http://localhost:11434"}/v1/chat/completions`;
        headers = { "Content-Type": "application/json" };
        body = {
          model: provider.model || "llama3.2",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          stream: false,
        };
        break;

      case "openai":
      case "grok":
      case "deepseek":
        return { 
          error: `${provider.name} cannot be called directly from the browser due to CORS restrictions. Please use Ollama for local analysis.` 
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
      return { error: `API error: ${response.status} - ${errorText.slice(0, 100)}` };
    }

    onProgress?.("Processing AI response...");

    const data = await response.json();
    const contentResponse = data.choices?.[0]?.message?.content || "";

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
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return { error: "Cannot reach Ollama. Make sure it's running at " + (provider.baseUrl || "http://localhost:11434") };
    }
    
    return { error: message };
  }
};

// Streaming analysis for Ollama
export const analyzeWithAIStreaming = async (
  content: string,
  provider: AIProvider,
  onProgress?: (stage: string) => void,
  onStreamChunk?: (chunk: string, fullText: string) => void
): Promise<{ summary?: string; severityBreakdown?: any; insights?: string[]; recommendations?: string[]; error?: string }> => {
  if (provider.id !== "ollama") {
    return { 
      error: `Streaming is only supported for Ollama. ${provider.name} cannot be called directly from the browser.` 
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
    const apiUrl = `${provider.baseUrl || "http://localhost:11434"}/v1/chat/completions`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: provider.model || "llama3.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Ollama error: ${response.status} - ${errorText.slice(0, 100)}` };
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
      
      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

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

    // Parse the final JSON
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Could not parse AI response as JSON. Raw response: " + fullText.slice(0, 200) };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      summary: result.summary,
      severityBreakdown: result.severityBreakdown,
      insights: result.insights,
      recommendations: result.recommendations,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    
    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return { error: "Cannot reach Ollama. Make sure it's running at " + (provider.baseUrl || "http://localhost:11434") };
    }
    
    return { error: message };
  }
};
