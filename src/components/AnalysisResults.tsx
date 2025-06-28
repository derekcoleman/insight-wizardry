
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTabs } from "@/components/analysis/DashboardTabs";
import { AnalysisInsights } from "@/components/AnalysisInsights";
import { ExportButtons } from "@/components/analysis/ExportButtons";

interface AnalysisResultsProps {
  report: any;
  isLoading: boolean;
}

export function AnalysisResults({ report, isLoading }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("ai-analysis");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) return null;

  // Convert report data to analyses format
  const analyses = [];
  
  if (report.weekly_analysis) {
    analyses.push({
      type: "Weekly",
      data: report.weekly_analysis,
      title: "Weekly Analysis",
      dateRange: "Last 7 days vs Previous 7 days"
    });
  }
  
  if (report.monthly_analysis) {
    analyses.push({
      type: "Monthly", 
      data: report.monthly_analysis,
      title: "Monthly Analysis",
      dateRange: "Last 30 days vs Previous 30 days"
    });
  }
  
  if (report.quarterly_analysis) {
    analyses.push({
      type: "Quarterly",
      data: report.quarterly_analysis, 
      title: "Quarterly Analysis",
      dateRange: "Last 90 days vs Previous 90 days"
    });
  }
  
  if (report.ytd_analysis) {
    analyses.push({
      type: "YTD",
      data: report.ytd_analysis,
      title: "Year-to-Date Analysis", 
      dateRange: "Year-to-date vs Previous year same period"
    });
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <ExportButtons report={report} insights={report.insights} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-analysis" className="mt-6">
          <DashboardTabs analyses={analyses} activeTab="ai-analysis" />
        </TabsContent>

        <TabsContent value="overview" className="mt-6">
          <DashboardTabs analyses={analyses} activeTab="overview" />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <DashboardTabs analyses={analyses} activeTab="performance" />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <DashboardTabs analyses={analyses} activeTab="search" />
        </TabsContent>

        <TabsContent value="pages" className="mt-6">
          <DashboardTabs analyses={analyses} activeTab="pages" />
        </TabsContent>
      </Tabs>

      {report.insights && (
        <div className="mt-8">
          <AnalysisInsights insights={report.insights} isLoading={false} />
        </div>
      )}
    </div>
  );
}
