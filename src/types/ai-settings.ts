export interface AIProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface AISettings {
  providers: AIProvider[];
  selectedProvider: string;
}

export const defaultAISettings: AISettings = {
  providers: [
    { id: "nvidia", name: "NVIDIA AI", enabled: true, apiKey: import.meta.env.VITE_NVIDIA_API_KEY || "", baseUrl: "https://integrate.api.nvidia.com/v1", model: "moonshotai/kimi-k2.5" },
    { id: "openai", name: "OpenAI", enabled: false, apiKey: "", model: "gpt-4o" },
    { id: "grok", name: "Grok (xAI)", enabled: false, apiKey: "", model: "grok-beta" },
    { id: "deepseek", name: "DeepSeek", enabled: false, apiKey: "", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    { id: "ollama", name: "Ollama (Local)", enabled: false, apiKey: "", baseUrl: "http://localhost:11434", model: "gpt-oss:20b" },
  ],
  selectedProvider: "nvidia",
};

export interface DeviceFailure {
  device: string;
  error: string;
  timestamp: string;
  severity: string;
  recommendation: string;
}

export interface LogAnalysis {
  id: string;
  fileName: string;
  uploadedAt: Date;
  status: "pending" | "analyzing" | "completed" | "error";
  summary?: string;
  severityBreakdown?: {
    critical: number;
    warning: number;
    info: number;
    success: number;
  };
  insights?: string[];
  recommendations?: string[];
  deviceFailures?: DeviceFailure[];
  rawContent?: string;
  provider?: string;
  error?: string;
}
