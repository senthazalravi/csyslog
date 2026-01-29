import { Header } from "@/components/dashboard/Header";
import { LogStream } from "@/components/dashboard/LogStream";
import { DeviceHealth } from "@/components/dashboard/DeviceHealth";
import { NetworkHealth } from "@/components/dashboard/NetworkHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { SystemOverview } from "@/components/dashboard/SystemOverview";
import { LogAnalyzer } from "@/components/analysis/LogAnalyzer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Upload, Brain } from "lucide-react";
import { DashboardSettings, defaultDashboardSettings } from "@/types/dashboard-settings";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const Index = () => {
  const [savedDashboardSettings] = useLocalStorage<DashboardSettings>("citadel-dashboard-settings", defaultDashboardSettings);
  const dashboardSettings = savedDashboardSettings;

  const anyModuleVisible = dashboardSettings.showSystemOverview || dashboardSettings.showNetworkHealth || dashboardSettings.showAIInsights || dashboardSettings.showAlertsSummary || dashboardSettings.showDeviceHealth;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="flex flex-col h-screen p-3 gap-3">
        {/* Header */}
        <Header systemStatus="online" aiStatus="connected" />

        {/* Main Content with Tabs */}
        <Tabs defaultValue="monitor" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit bg-secondary/50 self-start mb-3">
            <TabsTrigger value="monitor" className="text-xs gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="text-xs gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Log Analyzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="flex-1 min-h-0 mt-0">
            <div className="h-full flex flex-col gap-3 min-h-0">
              {/* Top - Live Monitor (edge-to-edge) */}
              <div className="w-full min-h-0 h-72 md:h-80 lg:h-[36rem] flex-none">
                {/* Live Log Stream is always shown */}
                <LogStream />
              </div>

              {/* Bottom - Other modules in a responsive 3-column grid */}
              <div className="flex-1 overflow-auto min-h-0">
                {!anyModuleVisible ? (
                  <div className="p-6">
                    <div className="tactical-panel p-4">
                      <h3 className="text-sm font-semibold text-foreground">No dashboard modules enabled</h3>
                      <p className="text-xs text-muted-foreground mt-2">Enable modules in Settings → Dashboard to show them below the Live Log Stream.</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full grid grid-cols-12 gap-3 min-h-0">
                    <div className="col-span-12 md:col-span-4 flex flex-col gap-3 min-h-0 h-full">
                      {dashboardSettings.showSystemOverview && <SystemOverview />}
                      {dashboardSettings.showNetworkHealth && (
                        <div className="min-h-0">
                          <NetworkHealth />
                        </div>
                      )}
                    </div>

                    <div className="col-span-12 md:col-span-5 flex flex-col gap-3 min-h-0 h-full">
                      <div className="flex-1 min-h-0">
                        {dashboardSettings.showAIInsights && <AIInsights />}
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-3 flex flex-col gap-3 min-h-0 h-full">
                      {dashboardSettings.showAlertsSummary && (
                        <div className="min-h-0">
                          <AlertsSummary />
                        </div>
                      )}
                      {dashboardSettings.showDeviceHealth && (
                        <div className="flex-1 min-h-0">
                          <DeviceHealth />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analyzer" className="flex-1 min-h-0 mt-0">
            <LogAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
