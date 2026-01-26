import { Activity, Clock, Server, Database, Layers } from "lucide-react";

export const SystemOverview = () => {
  const stats = [
    { label: "Uptime", value: "14d 7h 23m", icon: Clock },
    { label: "Logs Processed", value: "2.4M", icon: Database },
    { label: "Active Services", value: "12/12", icon: Server },
    { label: "AI Queries", value: "1,247", icon: Layers },
  ];

  return (
    <div className="tactical-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">System Overview</h2>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center mx-auto mb-2 border border-border">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold font-mono text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
