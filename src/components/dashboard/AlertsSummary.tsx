import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertCount {
  severity: "critical" | "high" | "medium" | "low";
  count: number;
  trend: "up" | "down" | "stable";
}

export const AlertsSummary = () => {
  const alerts: AlertCount[] = [
    { severity: "critical", count: 2, trend: "stable" },
    { severity: "high", count: 5, trend: "down" },
    { severity: "medium", count: 12, trend: "up" },
    { severity: "low", count: 34, trend: "stable" },
  ];

  const getIcon = (severity: AlertCount["severity"]) => {
    switch (severity) {
      case "critical": return AlertTriangle;
      case "high": return AlertCircle;
      case "medium": return Info;
      case "low": return CheckCircle;
    }
  };

  const getColors = (severity: AlertCount["severity"]) => {
    switch (severity) {
      case "critical": return { bg: "bg-critical/20", text: "text-critical", border: "border-critical/30" };
      case "high": return { bg: "bg-high/20", text: "text-high", border: "border-high/30" };
      case "medium": return { bg: "bg-warning/20", text: "text-warning", border: "border-warning/30" };
      case "low": return { bg: "bg-info/20", text: "text-info", border: "border-info/30" };
    }
  };

  const total = alerts.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="tactical-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Active Alerts</h2>
        <span className="text-xs font-mono text-muted-foreground">{total} total</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {alerts.map((alert) => {
          const Icon = getIcon(alert.severity);
          const colors = getColors(alert.severity);
          return (
            <div
              key={alert.severity}
              className={cn(
                "p-3 rounded-lg border text-center transition-all hover:scale-105 cursor-pointer",
                colors.bg,
                colors.border
              )}
            >
              <Icon className={cn("w-5 h-5 mx-auto mb-2", colors.text)} />
              <p className={cn("text-2xl font-bold font-mono", colors.text)}>{alert.count}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {alert.severity}
              </p>
              <div className="mt-1 text-[10px] font-mono">
                {alert.trend === "up" && <span className="text-critical">↑</span>}
                {alert.trend === "down" && <span className="text-success">↓</span>}
                {alert.trend === "stable" && <span className="text-muted-foreground">→</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
