export interface DashboardSettings {
  showLogStream: boolean;
  showSystemOverview: boolean;
  showNetworkHealth: boolean;
  showAIInsights: boolean;
  showAlertsSummary: boolean;
  showDeviceHealth: boolean;
}

export const defaultDashboardSettings: DashboardSettings = {
  showLogStream: true, // always true by default and will be enforced in the UI
  showSystemOverview: true,
  showNetworkHealth: true,
  showAIInsights: true,
  showAlertsSummary: true,
  showDeviceHealth: true,
};
