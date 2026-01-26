import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Filter, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;
  severity: "critical" | "warning" | "info" | "success";
  message: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "14:32:05.123", source: "kernel", severity: "critical", message: "CPU temperature exceeded threshold: 92°C" },
  { id: "2", timestamp: "14:32:04.891", source: "network", severity: "warning", message: "Packet loss detected on eth0: 2.3%" },
  { id: "3", timestamp: "14:32:04.456", source: "auth", severity: "info", message: "User admin authenticated successfully" },
  { id: "4", timestamp: "14:32:03.789", source: "system", severity: "success", message: "Service health check passed: all containers running" },
  { id: "5", timestamp: "14:32:03.234", source: "firewall", severity: "warning", message: "Blocked connection attempt from 192.168.1.105:4444" },
  { id: "6", timestamp: "14:32:02.567", source: "disk", severity: "info", message: "SMART check completed: /dev/sda status OK" },
  { id: "7", timestamp: "14:32:01.890", source: "memory", severity: "warning", message: "Memory usage at 78% - approaching threshold" },
  { id: "8", timestamp: "14:32:01.123", source: "docker", severity: "success", message: "Container citadel-ai started successfully" },
  { id: "9", timestamp: "14:32:00.456", source: "network", severity: "info", message: "DNS resolution time: 12ms (optimal)" },
  { id: "10", timestamp: "14:31:59.789", source: "auth", severity: "critical", message: "Failed login attempt: 3rd consecutive failure for user operator2" },
];

export const LogStream = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const sources = ["kernel", "network", "auth", "system", "firewall", "disk", "memory", "docker"];
      const severities: LogEntry["severity"][] = ["critical", "warning", "info", "success"];
      const messages = [
        "Connection established to monitoring endpoint",
        "Cache cleared successfully",
        "Background task completed in 234ms",
        "Configuration reload triggered",
        "Health check ping received",
        "Metrics exported to local store",
        "Log rotation completed",
        "Service discovery updated",
      ];

      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }) + "." + String(Date.now() % 1000).padStart(3, "0"),
        source: sources[Math.floor(Math.random() * sources.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const getSeverityClass = (severity: LogEntry["severity"]) => {
    switch (severity) {
      case "critical": return "log-critical";
      case "warning": return "log-warning";
      case "info": return "log-info";
      case "success": return "log-success";
    }
  };

  const getSeverityBadge = (severity: LogEntry["severity"]) => {
    const classes = {
      critical: "severity-critical",
      warning: "severity-medium",
      info: "severity-low",
      success: "bg-success/20 text-success border border-success/30",
    };
    return classes[severity];
  };

  return (
    <div className="tactical-panel h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Live Log Stream</h2>
          <span className="text-xs font-mono text-muted-foreground">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 text-success" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 tactical-scroll">
        <div className="p-2 space-y-1">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className={cn(
                "px-3 py-2 rounded text-xs font-mono animate-fade-in-up",
                getSeverityClass(log.severity)
              )}
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-24 shrink-0">{log.timestamp}</span>
                <span className={cn("px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold", getSeverityBadge(log.severity))}>
                  {log.severity}
                </span>
                <span className="text-primary/80 w-16 shrink-0">[{log.source}]</span>
                <span className="text-foreground/90 truncate">{log.message}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
