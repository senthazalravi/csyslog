import { Header } from "@/components/dashboard/Header";
import { LogStream } from "@/components/dashboard/LogStream";
import { DeviceHealth } from "@/components/dashboard/DeviceHealth";
import { NetworkHealth } from "@/components/dashboard/NetworkHealth";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { AlertsSummary } from "@/components/dashboard/AlertsSummary";
import { SystemOverview } from "@/components/dashboard/SystemOverview";
import { LogAnalyzer } from "@/components/analysis/LogAnalyzer";

const SectionDivider = ({ label }: { label: string }) => (
  <div className="section-divider">
    <span>{label}</span>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 p-3 pb-0">
        <Header systemStatus="online" aiStatus="connected" />
      </div>

      {/* Scrollable Content */}
      <div className="p-3 space-y-4">
        {/* ── System Overview ── full-width stat bar */}
        <SectionDivider label="System Status" />
        <div className="animate-fade-in-up tactical-panel-interactive">
          <SystemOverview />
        </div>

        {/* ── Live Monitor + AI Insights ── side by side */}
        <SectionDivider label="Live Monitoring" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div
            className="lg:col-span-8 animate-fade-in-up tactical-panel-interactive"
            style={{ animationDelay: "50ms" }}
          >
            <div className="h-[28rem] lg:h-[32rem]">
              <LogStream />
            </div>
          </div>
          <div
            className="lg:col-span-4 animate-fade-in-up tactical-panel-interactive"
            style={{ animationDelay: "100ms" }}
          >
            <div className="h-[28rem] lg:h-[32rem]">
              <AIInsights />
            </div>
          </div>
        </div>

        {/* ── System Health ── 3-column grid */}
        <SectionDivider label="System Health" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            className="animate-fade-in-up tactical-panel-interactive"
            style={{ animationDelay: "150ms" }}
          >
            <NetworkHealth />
          </div>
          <div
            className="animate-fade-in-up tactical-panel-interactive"
            style={{ animationDelay: "200ms" }}
          >
            <AlertsSummary />
          </div>
          <div
            className="animate-fade-in-up tactical-panel-interactive"
            style={{ animationDelay: "250ms" }}
          >
            <DeviceHealth />
          </div>
        </div>

        {/* ── Log Analyzer ── full-width section */}
        <SectionDivider label="Analysis" />
        <div
          className="animate-fade-in-up tactical-panel-interactive pb-6"
          style={{ animationDelay: "300ms" }}
        >
          <LogAnalyzer />
        </div>
      </div>
    </div>
  );
};

export default Index;
