import { useState } from "react";
import { Settings, Eye, EyeOff, Check, X, Server, Zap, Brain, Globe, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AISettings, defaultAISettings, AIProvider } from "@/types/ai-settings";
import { DashboardSettings, defaultDashboardSettings } from "@/types/dashboard-settings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import { ConnectionTest } from "./ConnectionTest";

interface AISettingsModalProps {
  trigger?: React.ReactNode;
}

const providerIcons: Record<string, typeof Brain> = {
  openai: Zap,
  grok: Brain,
  deepseek: Globe,
  ollama: Server,
};

export const AISettingsModal = ({ trigger }: AISettingsModalProps) => {
  const [savedSettings, setSavedSettings] = useLocalStorage<AISettings>("citadel-ai-settings", defaultAISettings);
  const [settings, setSettings] = useState<AISettings>(savedSettings);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Dashboard module visibility settings
  const [savedDashboardSettings, setSavedDashboardSettings] = useLocalStorage<DashboardSettings>("citadel-dashboard-settings", defaultDashboardSettings);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(savedDashboardSettings);

  const updateDashboard = (updates: Partial<DashboardSettings>) => {
    const next = { ...dashboardSettings, ...updates };
    setDashboardSettings(next);
    // Persist immediately so the dashboard view updates live
    setSavedDashboardSettings(next);
    // Mark as changed so Save Settings button reflects that something changed
    setHasChanges(true);
  };

  const handleSaveDashboard = () => {
    setSavedDashboardSettings(dashboardSettings);
    setHasChanges(false);
  };

  const handleSave = () => {
    setSavedSettings(settings);
    // also persist dashboard settings when saving the top-level settings
    setSavedDashboardSettings(dashboardSettings);
    setHasChanges(false);
  };

  const updateSettings = (newSettings: AISettings) => {
    setSettings(newSettings);
    setHasChanges(true);
  };

  const toggleShowKey = (providerId: string) => {
    setShowKeys(prev => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const updateProvider = (providerId: string, updates: Partial<AIProvider>) => {
    updateSettings({
      ...settings,
      providers: settings.providers.map(p =>
        p.id === providerId ? { ...p, ...updates } : p
      ),
    });
  };

  const selectProvider = (providerId: string) => {
    updateSettings({ ...settings, selectedProvider: providerId });
  };

  const getActiveProviders = () => settings.providers.filter(p => p.enabled && p.apiKey);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      {/* Smaller dialog that fits screen better */}
      <DialogContent className="max-w-xl max-h-[80vh] overflow-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5 text-primary" />
            AI Model Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure AI providers for log analysis. Ollama runs locally with no CORS restrictions.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="providers" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="active">Active Model</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4 mt-4">
            {settings.providers.map((provider) => {
              const Icon = providerIcons[provider.id] || Brain;
              return (
                <div
                  key={provider.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    provider.enabled ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center",
                        provider.enabled ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{provider.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {provider.id === "ollama" ? "Local models" : "Cloud API"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(checked) => updateProvider(provider.id, { enabled: checked })}
                    />
                  </div>

                  {provider.enabled && (
                    <div className="space-y-3 pt-3 border-t border-border/50">
                      {provider.id !== "ollama" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">API Key</Label>
                          <div className="relative">
                            <Input
                              type={showKeys[provider.id] ? "text" : "password"}
                              value={provider.apiKey}
                              onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                              placeholder="Enter API key..."
                              className="pr-10 bg-secondary/50 border-border font-mono text-xs"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => toggleShowKey(provider.id)}
                            >
                              {showKeys[provider.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {(provider.id === "deepseek" || provider.id === "ollama") && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Base URL</Label>
                          <Input
                            value={provider.baseUrl || ""}
                            onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                            placeholder="API base URL..."
                            className="bg-secondary/50 border-border font-mono text-xs"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Model</Label>
                        <Input
                          value={provider.model || ""}
                          onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                          placeholder="Model name..."
                          className="bg-secondary/50 border-border font-mono text-xs"
                        />
                      </div>

                      {/* Connection Test */}
                      <div className="pt-2">
                        <ConnectionTest provider={provider} />
                      </div>

                      {/* CORS Warning for cloud providers */}
                      {provider.id !== "ollama" && (
                        <div className="p-3 rounded-md bg-warning/10 border border-warning/30 text-xs">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-warning">Browser Limitation</p>
                              <p className="text-warning/80 mt-1">
                                Cloud APIs cannot be called directly from browsers due to CORS. 
                                For local analysis, use Ollama instead.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Select which provider to use for log analysis:
              </p>
              {getActiveProviders().length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border rounded-lg">
                  <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No providers configured. Enable a provider and add an API key to get started.
                  </p>
                </div>
              ) : (
                getActiveProviders().map((provider) => {
                  const Icon = providerIcons[provider.id] || Brain;
                  const isSelected = settings.selectedProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => selectProvider(provider.id)}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">{provider.name}</h4>
                        <p className="text-xs text-muted-foreground font-mono">{provider.model}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">Choose modules to show on the dashboard. <span className="text-xs text-muted-foreground">(Live Log Stream is always displayed)</span></p>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm text-foreground">Live Log Stream</p>
                    <p className="text-xs text-muted-foreground">Always shown at the top</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm text-foreground">System Overview</p>
                    <p className="text-xs text-muted-foreground">Top-left module</p>
                  </div>
                  <Switch checked={dashboardSettings.showSystemOverview} onCheckedChange={(v) => updateDashboard({ showSystemOverview: Boolean(v) })} />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm text-foreground">Network Health</p>
                    <p className="text-xs text-muted-foreground">Network metrics and interfaces</p>
                  </div>
                  <Switch checked={dashboardSettings.showNetworkHealth} onCheckedChange={(v) => updateDashboard({ showNetworkHealth: Boolean(v) })} />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm text-foreground">AI Insights</p>
                    <p className="text-xs text-muted-foreground">AI-generated alerts and recommendations</p>
                  </div>
                  <Switch checked={dashboardSettings.showAIInsights} onCheckedChange={(v) => updateDashboard({ showAIInsights: Boolean(v) })} />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm text-foreground">Active Alerts</p>
                    <p className="text-xs text-muted-foreground">Aggregated alert counts</p>
                  </div>
                  <Switch checked={dashboardSettings.showAlertsSummary} onCheckedChange={(v) => updateDashboard({ showAlertsSummary: Boolean(v) })} />
                </div>

                <div className="flex items-center justify-between p-2 rounded border border-border bg-secondary/20">
                  <div>
                    <p className="text-sm text-foreground">Device Health</p>
                    <p className="text-xs text-muted-foreground">CPU, memory, disk metrics</p>
                  </div>
                  <Switch checked={dashboardSettings.showDeviceHealth} onCheckedChange={(v) => updateDashboard({ showDeviceHealth: Boolean(v) })} />
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="ghost" onClick={() => { setDashboardSettings(savedDashboardSettings); setSavedDashboardSettings(savedDashboardSettings); }}>Revert</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => { handleSave(); handleSaveDashboard(); setOpen(false); }} 
            disabled={!hasChanges}
            className="bg-primary hover:bg-primary/90"
          >
            <Check className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
