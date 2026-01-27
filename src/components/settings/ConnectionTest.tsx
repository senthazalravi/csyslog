import { useState } from "react";
import { Wifi, WifiOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIProvider } from "@/types/ai-settings";
import { testConnection, ConnectionTestResult } from "@/lib/ai-providers";
import { cn } from "@/lib/utils";

interface ConnectionTestProps {
  provider: AIProvider;
}

export const ConnectionTest = ({ provider }: ConnectionTestProps) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const testResult = await testConnection(provider);
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const canTest = provider.enabled && (provider.apiKey || provider.id === "ollama");

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
            Testing Connection...
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 mr-2" />
            Test Connection
          </>
        )}
      </Button>

      {result && (
        <div className={cn(
          "p-3 rounded-md text-xs flex items-start gap-2",
          result.success 
            ? "bg-success/10 border border-success/30" 
            : "bg-critical/10 border border-critical/30"
        )}>
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-critical shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium",
              result.success ? "text-success" : "text-critical"
            )}>
              {result.success ? "Connection Successful" : "Connection Failed"}
            </p>
            <p className={cn(
              "mt-0.5",
              result.success ? "text-success/80" : "text-critical/80"
            )}>
              {result.message}
            </p>
            {result.latency && (
              <p className="text-muted-foreground mt-1">
                Latency: {result.latency}ms
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
