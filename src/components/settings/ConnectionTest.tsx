import { useState } from "react";
import { Wifi, Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
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
  const [pullProgress, setPullProgress] =
    useState<OllamaModelPullProgress | null>(null);

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

  const canTest =
    provider.enabled && (provider.apiKey || provider.id === "ollama");

  const isPulling =
    pullProgress !== null &&
    pullProgress.percent >= 0 &&
    pullProgress.percent < 100;

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={!canTest || testing}
        className="w-full"
      >
        {testing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            {isPulling ? "Pulling Model…" : "Testing Connection…"}
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 mr-2" />
            Test Connection
          </>
        )}
      </Button>

      {/* Pull progress bar */}
      {testing && pullProgress && (
        <div className="p-3 rounded-md bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{pullProgress.status}</span>
          </div>

          {pullProgress.percent >= 0 && (
            <>
              {/* Progress bar */}
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(pullProgress.percent, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{pullProgress.percent}%</span>
                {pullProgress.completedBytes != null &&
                  pullProgress.totalBytes != null && (
                    <span>
                      {formatBytes(pullProgress.completedBytes)} /{" "}
                      {formatBytes(pullProgress.totalBytes)}
                    </span>
                  )}
              </div>
            </>
          )}

          {/* Indeterminate spinner for non-progress statuses */}
          {pullProgress.percent < 0 && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Working…</span>
            </div>
          )}
        </div>
      )}

      {/* Final result */}
      {result && (
        <div
          className={cn(
            "p-3 rounded-md text-xs flex flex-col gap-2",
            result.success
              ? "bg-success/10 border border-success/30"
              : "bg-critical/10 border border-critical/30"
          )}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-critical shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "font-medium",
                  result.success ? "text-success" : "text-critical"
                )}
              >
                {result.success ? "Connection Successful" : "Connection Failed"}
              </p>
              <p
                className={cn(
                  "mt-0.5",
                  result.success ? "text-success/80" : "text-critical/80"
                )}
              >
                {result.message}
              </p>
              {result.latency && (
                <p className="text-muted-foreground mt-1">
                  Latency: {result.latency}ms
                </p>
              )}
            </div>
          </div>

          {result.modelResponse && (
            <div className="mt-1 p-2 rounded bg-secondary/50 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Model Response
              </p>
              <p className="text-xs font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {result.modelResponse}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
