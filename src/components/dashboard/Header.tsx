import { Shield, Wifi, WifiOff, Cpu, Activity } from "lucide-react";

interface HeaderProps {
  systemStatus: "online" | "warning" | "offline";
  aiStatus: "connected" | "disconnected";
}

export const Header = ({ systemStatus, aiStatus }: HeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
      case "connected":
        return "status-dot-ok";
      case "warning":
        return "status-dot-warning";
      default:
        return "status-dot-critical";
    }
  };

  return (
    <header className="tactical-panel px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              CITADEL<span className="text-primary">SYSLOG</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">AI Operator Co-Pilot v1.0</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* System Status */}
        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System</span>
          </div>
          <div className={`status-dot ${getStatusColor(systemStatus)}`} />
          <span className="text-xs font-mono text-foreground capitalize">{systemStatus}</span>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Engine</span>
          </div>
          <div className={`status-dot ${getStatusColor(aiStatus)}`} />
          <span className="text-xs font-mono text-foreground capitalize">{aiStatus}</span>
        </div>

        {/* Network Indicator */}
        <div className="flex items-center gap-2 text-muted-foreground">
          {systemStatus !== "offline" ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-critical" />
          )}
        </div>
      </div>
    </header>
  );
};
