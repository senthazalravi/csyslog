import { Header } from "@/components/dashboard/Header";
import { LogStream } from "@/components/dashboard/LogStream";
import { DeviceHealth } from "@/components/dashboard/DeviceHealth";
import { NetworkHealth } from "@/components/dashboard/NetworkHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { SystemOverview } from "@/components/dashboard/SystemOverview";

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="flex flex-col h-screen p-4 gap-4">
        {/* Header */}
        <Header systemStatus="online" aiStatus="connected" />

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Column - Log Stream */}
          <div className="col-span-5 flex flex-col gap-4 min-h-0">
            <div className="flex-1 min-h-0">
              <LogStream />
            </div>
          </div>

          {/* Center Column - AI Insights */}
          <div className="col-span-4 flex flex-col gap-4 min-h-0">
            <SystemOverview />
            <div className="flex-1 min-h-0">
              <AIInsights />
            </div>
          </div>

          {/* Right Column - Health Panels */}
          <div className="col-span-3 flex flex-col gap-4 min-h-0">
            <AlertsSummary />
            <div className="flex-1 min-h-0">
              <DeviceHealth />
            </div>
            <div className="flex-1 min-h-0">
              <NetworkHealth />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
