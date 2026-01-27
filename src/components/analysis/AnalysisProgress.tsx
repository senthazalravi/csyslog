import { Brain, FileSearch, Cpu, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
  stage: string;
  progress: number;
  error?: string;
}

const stages = [
  { id: "testing", label: "Testing Connection", icon: Cpu },
  { id: "connecting", label: "Connecting to AI", icon: Brain },
  { id: "sending", label: "Sending Log Data", icon: FileSearch },
  { id: "processing", label: "Processing Response", icon: Brain },
  { id: "finalizing", label: "Finalizing Report", icon: CheckCircle2 },
];

export const AnalysisProgress = ({ stage, progress, error }: AnalysisProgressProps) => {
  const currentStageIndex = stages.findIndex(s => stage.toLowerCase().includes(s.id) || stage.toLowerCase().includes(s.label.toLowerCase().split(" ")[0]));
  
  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
            style={{ animationDuration: "1.5s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground">Analyzing Log File</h3>
        <p className="text-sm text-muted-foreground">{stage}</p>
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
