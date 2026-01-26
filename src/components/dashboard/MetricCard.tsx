import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: "ok" | "warning" | "critical";
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  subtitle?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  status = "ok",
  trend,
  trendValue,
  subtitle,
}: MetricCardProps) => {
  const statusStyles = {
    ok: "text-success text-glow-success",
    warning: "text-warning text-glow-warning",
    critical: "text-critical text-glow-critical",
  };

  const borderStyles = {
    ok: "glow-border-success",
    warning: "glow-border-warning",
    critical: "glow-border-critical",
  };

  return (
    <div className={cn("tactical-panel p-4 border", borderStyles[status])}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-secondary/50">
            <Icon className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
        <div className={cn("status-dot", {
          "status-dot-ok": status === "ok",
          "status-dot-warning": status === "warning",
          "status-dot-critical": status === "critical",
        })} />
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={cn("metric-value", statusStyles[status])}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-mono">{unit}</span>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && trendValue && (
            <span className={cn("text-xs font-mono", {
              "text-success": trend === "down" && status === "ok",
              "text-critical": trend === "up" && status !== "ok",
              "text-muted-foreground": trend === "stable",
            })}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
