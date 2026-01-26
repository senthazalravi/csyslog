import { 
  FileText, Download, AlertTriangle, CheckCircle, 
  Info, AlertCircle, TrendingUp, Lightbulb, Clock,
  FileJson, FileType
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogAnalysis } from "@/types/ai-settings";
import { cn } from "@/lib/utils";

interface AnalysisReportProps {
  analysis: LogAnalysis;
  onExport: (format: "json" | "txt") => void;
}

export const AnalysisReport = ({ analysis, onExport }: AnalysisReportProps) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return AlertCircle;
      case "warning": return AlertTriangle;
      case "info": return Info;
      default: return CheckCircle;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  if (analysis.status === "pending" || analysis.status === "analyzing") {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm text-foreground">Analyzing {analysis.fileName}...</p>
        <p className="text-xs text-muted-foreground mt-1">This may take a few moments</p>
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-lg bg-critical/20 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5 text-critical" />
        </div>
        <p className="text-sm text-foreground">Analysis Failed</p>
        <p className="text-xs text-critical mt-1">{analysis.error || "Unknown error occurred"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Report Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">{analysis.fileName}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDate(analysis.uploadedAt)}</span>
              {analysis.provider && (
                <>
                  <span>•</span>
                  <span>via {analysis.provider}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onExport("json")}
          >
            <FileJson className="w-3.5 h-3.5 mr-1.5" />
            JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onExport("txt")}
          >
            <FileType className="w-3.5 h-3.5 mr-1.5" />
            TXT
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Severity Breakdown */}
          {analysis.severityBreakdown && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Severity Breakdown
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(analysis.severityBreakdown).map(([severity, count]) => {
                  const Icon = getSeverityIcon(severity);
                  return (
                    <div
                      key={severity}
                      className={cn(
                        "p-3 rounded-lg text-center",
                        severity === "critical" && "bg-critical/10 border border-critical/20",
                        severity === "warning" && "bg-warning/10 border border-warning/20",
                        severity === "info" && "bg-info/10 border border-info/20",
                        severity === "success" && "bg-success/10 border border-success/20"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4 mx-auto mb-1",
                        severity === "critical" && "text-critical",
                        severity === "warning" && "text-warning",
                        severity === "info" && "text-info",
                        severity === "success" && "text-success"
                      )} />
                      <p className="text-lg font-mono font-semibold text-foreground">{count}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">{severity}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {analysis.summary && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Summary
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Key Insights */}
          {analysis.insights && analysis.insights.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Key Insights
              </h4>
              <div className="space-y-2">
                {analysis.insights.map((insight, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-secondary/50 border border-border text-sm text-foreground/90"
                  >
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-warning" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-sm text-foreground/90 flex items-start gap-2"
                  >
                    <span className="text-warning font-mono text-xs">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
