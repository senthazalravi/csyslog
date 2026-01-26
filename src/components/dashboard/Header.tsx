import { Shield, Wifi, WifiOff, Cpu, Activity, Settings } from "lucide-react";
import { AISettingsModal } from "@/components/settings/AISettingsModal";
import { Button } from "@/components/ui/button";

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
    <header className="tactical-panel px-4 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground tracking-tight leading-tight">
            CITADEL<span className="text-primary">SYSLOG</span>
          </h1>
          <p className="text-[10px] text-muted-foreground font-mono">AI Operator Co-Pilot v1.0</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-md border border-border">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase">System</span>
          <div className={`status-dot ${getStatusColor(systemStatus)}`} />
          <span className="text-[10px] font-mono text-foreground capitalize">{systemStatus}</span>
        </div>

        {/* AI Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-md border border-border">
          <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase">AI</span>
          <div className={`status-dot ${getStatusColor(aiStatus)}`} />
          <span className="text-[10px] font-mono text-foreground capitalize">{aiStatus}</span>
        </div>

        {/* Network */}
        <div className="flex items-center gap-2 text-muted-foreground">
          {systemStatus !== "offline" ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-critical" />
          )}
        </div>

        {/* Settings */}
        <AISettingsModal
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          }
        />
      </div>
    </header>
  );
};
