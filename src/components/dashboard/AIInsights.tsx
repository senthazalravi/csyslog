import { Brain, AlertTriangle, CheckCircle, Lightbulb, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Insight {
  id: string;
  type: "alert" | "recommendation" | "prediction" | "resolved";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
  action?: string;
}

const mockInsights: Insight[] = [
  {
    id: "1",
    type: "alert",
    severity: "critical",
    title: "Memory Pressure Detected",
    description: "System memory usage at 78% and trending upward. Container 'citadel-worker' consuming 2.4GB. Potential memory leak identified in log analysis.",
    timestamp: "2 min ago",
    action: "Consider restarting citadel-worker service",
  },
  {
    id: "2",
    type: "alert",
    severity: "high",
    title: "Multiple Failed Logins",
    description: "Detected repeated failed login attempts across several IPs; potential brute force activity.",
    timestamp: "5 min ago",
    action: "Investigate source IPs and enable rate limiting",
  },
  {
    id: "3",
    type: "alert",
    severity: "high",
    title: "Packet Loss Spike",
    description: "Packet loss spiked to 8% on core switch during last 10 minutes affecting monitoring traffic.",
    timestamp: "10 min ago",
  },
  {
    id: "4",
    type: "alert",
    severity: "medium",
    title: "Elevated Error Rate",
    description: "API error rate increased by 12% compared to baseline.",
    timestamp: "20 min ago",
  },
  {
    id: "5",
    type: "alert",
    severity: "low",
    title: "Configuration Drift",
    description: "Minor configuration changes detected on non-critical nodes.",
    timestamp: "1 hour ago",
  },
  {
    id: "6",
    type: "prediction",
    severity: "medium",
    title: "Disk Failure Predicted",
    description: "SMART data analysis indicates /dev/sdb may fail within 30 days.",
    timestamp: "15 min ago",
    action: "Schedule disk replacement",
  },
  {
    id: "7",
    type: "recommendation",
    severity: "low",
    title: "Network Optimization Available",
    description: "Suggest adjusting QoS rules for monitoring traffic.",
    timestamp: "1 hour ago",
  },
];

export const AIInsights = () => {
  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "alert": return AlertTriangle;
      case "recommendation": return Lightbulb;
      case "prediction": return TrendingUp;
      case "resolved": return CheckCircle;
    }
  };

  const getTypeColor = (type: Insight["type"]) => {
    switch (type) {
      case "alert": return "text-critical";
      case "recommendation": return "text-info";
      case "prediction": return "text-warning";
      case "resolved": return "text-success";
    }
  };

  const getSeverityBadge = (severity: Insight["severity"]) => {
    const classes = {
      critical: "severity-critical",
      high: "severity-high",
      medium: "severity-medium",
      low: "severity-low",
    };
    return classes[severity];
  };

  return (
    <div className="tactical-panel h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">AI Insights</h2>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last updated: 30s ago</span>
        </div>
      </div>

      <ScrollArea className="flex-1 tactical-scroll">
        <div className="p-3 space-y-3">
          {mockInsights.map((insight) => {
            const Icon = getIcon(insight.type);
            return (
              <div
                key={insight.id}
                className={cn(
                  "p-4 rounded-lg border transition-all hover:border-primary/30",
                  "bg-gradient-to-br from-secondary/50 to-secondary/20",
                  insight.type === "alert" && insight.severity === "critical" && "border-critical/30 glow-border-critical",
                  insight.type === "resolved" && "border-success/20 opacity-75"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-md bg-secondary", getTypeColor(insight.type))}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-semibold", getSeverityBadge(insight.severity))}>
                        {insight.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{insight.timestamp}</span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">{insight.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                    {insight.action && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-primary flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          {insight.action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
