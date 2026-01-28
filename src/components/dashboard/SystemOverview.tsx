import { useState, useEffect } from "react";
import { Activity, Clock, Server, Database, Layers } from "lucide-react";

// Store app start time at module level so it persists across re-renders
const appStartTime = Date.now();

const formatUptime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  const displaySeconds = seconds % 60;
  const displayMinutes = minutes % 60;
  const displayHours = hours;

  if (hours > 0) {
    return `${displayHours}h ${displayMinutes}m ${displaySeconds}s`;
  } else if (minutes > 0) {
    return `${displayMinutes}m ${displaySeconds}s`;
  }
  return `${displaySeconds}s`;
};

export const SystemOverview = () => {
  const [uptime, setUptime] = useState("0s");
  const [logsProcessed, setLogsProcessed] = useState(0);

  useEffect(() => {
    // Update uptime every second
    const interval = setInterval(() => {
      const elapsed = Date.now() - appStartTime;
      setUptime(formatUptime(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate logs being processed (increments with log stream)
  useEffect(() => {
    const interval = setInterval(() => {
      setLogsProcessed(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Session Uptime", value: uptime, icon: Clock },
    { label: "Logs Displayed", value: logsProcessed.toLocaleString(), icon: Database },
    { label: "Active Services", value: "12/12", icon: Server },
    { label: "AI Queries", value: "0", icon: Layers },
  ];

  return (
    <div className="tactical-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">System Overview</h2>
        <span className="text-[10px] text-muted-foreground ml-auto">(Display only - no storage)</span>
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
