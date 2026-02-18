import { Brain, FileSearch, Cpu, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
  stage: string;
  progress: number;
  error?: string;
  streamingText?: string;
}

const stages = [
  { id: "testing", label: "Testing Connection", icon: Cpu },
  { id: "connecting", label: "Connecting to AI", icon: Brain },
  { id: "sending", label: "Sending Log Data", icon: FileSearch },
  { id: "streaming", label: "Streaming Response", icon: Zap },
  { id: "processing", label: "Processing Response", icon: Brain },
  { id: "parsing", label: "Parsing Results", icon: Brain },
  { id: "finalizing", label: "Finalizing Report", icon: CheckCircle2 },
];

export const AnalysisProgress = ({ stage, progress, error, streamingText }: AnalysisProgressProps) => {
  const currentStageIndex = stages.findIndex(s =>
    stage.toLowerCase().includes(s.id) ||
    stage.toLowerCase().includes(s.label.toLowerCase().split(" ")[0])
  );

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
          <div
            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
            style={{ animationDuration: "1s" }}
          />
          <div className="absolute inset-1 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center overflow-hidden">
            {/* Scanning line for tactical feel */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-1/2 w-full animate-scan-line" style={{ animation: "scan-line 2s linear infinite" }} />
            <Brain className="w-10 h-10 text-primary animate-pulse relative z-10" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-foreground tracking-tight">ANALYZING LOG SEQUENCE</h3>
        <p className="text-xs font-mono text-primary/70 uppercase tracking-widest">{stage}</p>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}% complete</p>
      </div>

      {error ? (
        <div className="p-4 rounded-lg bg-critical/10 border border-critical/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-critical shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-critical">Analysis Failed</p>
              <p className="text-xs text-critical/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : streamingText ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>AI Response (streaming live)</span>
          </div>
          <ScrollArea className="h-40 rounded-md border border-border bg-secondary/30 p-3">
            <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-words leading-relaxed">
              {streamingText}
              <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse rounded-sm" />
            </pre>
          </ScrollArea>
        </div>
      ) : (
        <div className="space-y-2">
          {stages.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;
            const isPending = idx > currentStageIndex;

            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md transition-all duration-300",
                  isActive && "bg-primary/10 border border-primary/30",
                  isCompleted && "opacity-60",
                  isPending && "opacity-30"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "bg-success text-success-foreground",
                  isPending && "bg-secondary text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className={cn("w-3.5 h-3.5", isActive && "animate-pulse")} />
                  )}
                </div>
                <span className={cn(
                  "text-sm",
                  isActive && "text-foreground font-medium",
                  isCompleted && "text-muted-foreground",
                  isPending && "text-muted-foreground"
                )}>
                  {s.label}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
