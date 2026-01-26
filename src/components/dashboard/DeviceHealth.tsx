import { Cpu, HardDrive, Thermometer, Fan, MemoryStick, Zap } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface HealthMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  status: "ok" | "warning" | "critical";
}

export const DeviceHealth = () => {
  const metrics: HealthMetric[] = [
    { label: "CPU Usage", value: 45, max: 100, unit: "%", status: "ok" },
    { label: "Memory", value: 78, max: 100, unit: "%", status: "warning" },
    { label: "GPU Temp", value: 72, max: 100, unit: "°C", status: "ok" },
    { label: "Disk I/O", value: 23, max: 100, unit: "%", status: "ok" },
  ];

  const getProgressColor = (status: HealthMetric["status"]) => {
    switch (status) {
      case "ok": return "bg-success";
      case "warning": return "bg-warning";
      case "critical": return "bg-critical";
    }
  };

  return (
    <div className="tactical-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Device Health</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricCard
          title="CPU Temp"
          value={67}
          unit="°C"
          icon={Thermometer}
          status="ok"
          trend="stable"
          trendValue="±2°C"
        />
        <MetricCard
          title="Fan Speed"
          value={2400}
          unit="RPM"
          icon={Fan}
          status="ok"
          trend="stable"
        />
      </div>

      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className={cn("font-mono", {
                "text-success": metric.status === "ok",
                "text-warning": metric.status === "warning",
                "text-critical": metric.status === "critical",
              })}>
                {metric.value}{metric.unit}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", getProgressColor(metric.status))}
                style={{ width: `${(metric.value / metric.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-secondary/30 rounded">
            <HardDrive className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Disk</p>
            <p className="text-xs font-mono text-success">OK</p>
          </div>
          <div className="p-2 bg-secondary/30 rounded">
            <MemoryStick className="w-4 h-4 text-warning mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">RAM</p>
            <p className="text-xs font-mono text-warning">78%</p>
          </div>
          <div className="p-2 bg-secondary/30 rounded">
            <Zap className="w-4 h-4 text-success mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Power</p>
            <p className="text-xs font-mono text-success">OK</p>
          </div>
        </div>
      </div>
    </div>
  );
};
