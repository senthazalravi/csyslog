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

// Analyze logs with AI provider
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
        // Ollama uses OpenAI-compatible endpoint
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
        apiUrl = "https://api.openai.com/v1/chat/completions";
        headers = {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: provider.model || "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          temperature: 0.3,
        };
        break;

      case "grok":
        apiUrl = "https://api.x.ai/v1/chat/completions";
        headers = {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: provider.model || "grok-beta",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          temperature: 0.3,
        };
        break;

      case "deepseek":
        apiUrl = `${provider.baseUrl || "https://api.deepseek.com"}/chat/completions`;
        headers = {
          "Authorization": `Bearer ${provider.apiKey}`,
          "Content-Type": "application/json",
        };
        body = {
          model: provider.model || "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this log:\n\n${truncatedContent}` },
          ],
          temperature: 0.3,
        };
        break;

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
      
      // Check for CORS-related errors
      if (provider.id !== "ollama") {
        return { 
          error: `API Error (${response.status}): Cloud-based APIs like ${provider.name} cannot be called directly from the browser due to CORS restrictions. Please use Ollama for local analysis, or the app needs a backend proxy to call cloud APIs.` 
        };
      }
      
      return { error: `API error: ${response.status} - ${errorText.slice(0, 100)}` };
    }

    onProgress?.("Processing AI response...");

    const data = await response.json();
    
    // Extract content - OpenAI-compatible format
    const contentResponse = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
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
    
    if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("CORS")) {
      if (provider.id === "ollama") {
        return { error: "Cannot reach Ollama. Make sure it's running at " + (provider.baseUrl || "http://localhost:11434") };
      }
      return { 
        error: `Cannot call ${provider.name} directly from browser due to CORS. Use Ollama for local analysis.` 
      };
    }
    
    return { error: message };
  }
};
