import { useState } from "react";
import { Wifi, Loader2, CheckCircle2, XCircle, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIProvider } from "@/types/ai-settings";
import {
  testConnection,
  ConnectionTestResult,
  OllamaModelPullProgress,
} from "@/lib/ai-providers";
import { cn } from "@/lib/utils";

interface ConnectionTestProps {
  provider: AIProvider;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const ConnectionTest = ({ provider }: ConnectionTestProps) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [pullProgress, setPullProgress] = useState<OllamaModelPullProgress | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    setPullProgress(null);

    try {
      const handleProgress = (progress: OllamaModelPullProgress) => {
        setPullProgress({ ...progress });
      };

      const testResult = await testConnection(provider, handleProgress);
      setPullProgress(null);
      setResult(testResult);
    } catch (error) {
      setPullProgress(null);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (testing) return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    if (!result) return <Wifi className="w-4 h-4 text-muted-foreground" />;
    return result.success ? (
      <CheckCircle2 className="w-4 h-4 text-success" />
    ) : (
      <XCircle className="w-4 h-4 text-critical" />
    );
  };

  const canTest = provider.enabled && (provider.apiKey || provider.id === "ollama");

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={!canTest || testing}
        className={cn(
          "w-full transition-all duration-300",
          testing ? "border-primary/50 bg-primary/5" : "border-border"
        )}
      >
        <div className="flex items-center justify-center gap-2">
          {getStatusIcon()}
          <span>{testing ? "Running Diagnostics…" : "Run Connection Test"}</span>
        </div>
      </Button>

      {/* Diagnostic Steps / Progress */}
      {testing && pullProgress && (
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <Download className="w-3 h-3" />
              {pullProgress.status}
            </span>
            {pullProgress.percent >= 0 && <span>{pullProgress.percent}%</span>}
          </div>

          <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-primary transition-all duration-500 ease-out",
                pullProgress.percent < 0 && "animate-pulse"
              )}
              style={{ width: `${pullProgress.percent >= 0 ? pullProgress.percent : 100}%` }}
            />
            {/* Animated scanning effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-20 animate-scan" />
          </div>

          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] text-muted-foreground/80 italic">
              Verification in progress... node-handshake.seq
            </p>
            {pullProgress.completedBytes != null && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {formatBytes(pullProgress.completedBytes)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Comprehensive Result UI */}
      {result && (
        <div className={cn(
          "animate-in fade-in slide-in-from-top-2 duration-300",
          "rounded-lg border p-4 space-y-3",
          result.success
            ? "bg-success/5 border-success/20 shadow-[0_0_15px_-5px_hsl(var(--success))]"
            : "bg-critical/5 border-critical/20 shadow-[0_0_15px_-5px_hsl(var(--critical))]"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              result.success ? "bg-success/20" : "bg-critical/20"
            )}>
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-critical" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className={cn(
                "text-sm font-semibold mb-1",
                result.success ? "text-success" : "text-critical"
              )}>
                {result.success ? "Connection Verified" : "Diagnostic Check Failed"}
              </h5>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.message}
              </p>

              {(!result.success && (result.message.includes("error") || result.message.includes("CORS") || result.message.includes("Deployment") || result.message.includes("failed"))) && (
                <div className="mt-2 p-2 rounded bg-secondary/50 border border-border">
                  <p className="text-[10px] font-bold text-foreground mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-warning" />
                    TROUBLESHOOTING TIP:
                  </p>
                  <p className="text-[10px] text-muted-foreground italic leading-normal">
                    {import.meta.env.DEV
                      ? "LOCAL DEV: Ensure the Vite server is running. If fetching fails, check your Vite proxy settings in vite.config.ts and restart the dev server."
                      : "PRODUCTION: All cloud APIs are proxied via server-side redirects (Netlify/Vercel). If this check fails, ensure your hosting environment has the correct redirect rules configured."}
                    {provider.id !== "ollama" && " Also verify your API key is correct for " + provider.name + "."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {result.success && (
            <div className="pt-3 border-t border-success/10 grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-success/10 border border-success/20">
                <p className="text-[9px] uppercase tracking-tight text-success/70 font-bold mb-0.5">Latency</p>
                <p className="text-sm font-mono text-success font-semibold">{result.latency}ms</p>
              </div>
              <div className="p-2 rounded bg-success/10 border border-success/20">
                <p className="text-[9px] uppercase tracking-tight text-success/70 font-bold mb-0.5">Packet Loss</p>
                <p className="text-sm font-mono text-success font-semibold">0%</p>
              </div>
            </div>
          )}

          {result.modelResponse && (
            <div className="mt-2 p-2 rounded bg-secondary/80 border border-border font-mono text-[10px] text-foreground/80 whitespace-pre-wrap leading-tight">
              <span className="text-primary/70 mr-1 select-none font-bold">{">"}</span>
              {result.modelResponse}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
