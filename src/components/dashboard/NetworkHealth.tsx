import { Network, Signal, Globe, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkMetric {
  label: string;
  value: string;
  status: "ok" | "warning" | "critical";
  icon: typeof Network;
}

export const NetworkHealth = () => {
  const metrics: NetworkMetric[] = [
    { label: "Latency", value: "12ms", status: "ok", icon: Activity },
    { label: "Packet Loss", value: "0.1%", status: "ok", icon: Signal },
    { label: "DNS", value: "OK", status: "ok", icon: Globe },
    { label: "Firewall", value: "Active", status: "ok", icon: Shield },
  ];

  const connections = [
    { name: "eth0", status: "connected", ip: "192.168.1.10", speed: "1Gbps" },
    { name: "wlan0", status: "disabled", ip: "—", speed: "—" },
    { name: "vpn0", status: "connected", ip: "10.0.0.5", speed: "100Mbps" },
  ];

  return (
    <div className="tactical-panel p-4 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Network Health</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.label}
              className="p-3 bg-secondary/30 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {metric.label}
                </span>
              </div>
              <p className={cn("text-sm font-mono font-semibold", {
                "text-success": metric.status === "ok",
                "text-warning": metric.status === "warning",
                "text-critical": metric.status === "critical",
              })}>
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Interfaces</p>
        {connections.map((conn) => (
          <div 
            key={conn.name}
            className="flex items-center justify-between p-2 bg-secondary/20 rounded border border-border"
          >
            <div className="flex items-center gap-3">
              <div className={cn("status-dot", {
                "status-dot-ok": conn.status === "connected",
                "status-dot-warning": conn.status === "warning",
                "status-dot-critical": conn.status === "disabled",
              })} />
              <div>
                <p className="text-xs font-mono text-foreground">{conn.name}</p>
                <p className="text-[10px] text-muted-foreground">{conn.ip}</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{conn.speed}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Bandwidth Usage</span>
          <span className="font-mono text-primary">↓ 24.5 MB/s ↑ 8.2 MB/s</span>
        </div>
      </div>
    </div>
  );
};
