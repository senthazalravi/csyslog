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

const Index = () => {
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
            <div className="h-full grid grid-cols-12 gap-3">
              {/* Left Column - Log Stream (narrower) */}
              <div className="col-span-4 min-h-0">
                <LogStream />
              </div>

              {/* Center Column - AI Insights */}
              <div className="col-span-5 flex flex-col gap-3 min-h-0">
                <SystemOverview />
                <div className="flex-1 min-h-0">
                  <AIInsights />
                </div>
              </div>

              {/* Right Column - Health Panels */}
              <div className="col-span-3 flex flex-col gap-3 min-h-0">
                <AlertsSummary />
                <div className="flex-1 min-h-0">
                  <DeviceHealth />
                </div>
                <div className="flex-1 min-h-0">
                  <NetworkHealth />
                </div>
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
