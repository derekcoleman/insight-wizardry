import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AnalysisResults } from "./AnalysisResults";
import { LineChart, BarChart3, Share2, MessageSquareShare, TrendingUp, Mail } from "lucide-react";
import { MetricOverviewCard } from "./MetricOverviewCard";
import { useState, useEffect } from "react";

interface GrowthChannelTabsProps {
  defaultTab?: string;
  analysisData: {
    report: {
      weekly_analysis: any;
      monthly_analysis: any;
      quarterly_analysis: any;
      ytd_analysis: any;
      last28_yoy_analysis: any;
      insights?: string;
    } | null;
  } | null;
}

export function GrowthChannelTabs({ defaultTab = "growth", analysisData }: GrowthChannelTabsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  
  useEffect(() => {
    if (analysisData?.report) {
      setInsights(analysisData.report.insights || null);
    }
  }, [analysisData]);

  const getMetricsForChannel = (analysis: any, channelName: string) => {
    if (!analysis?.current) {
      console.warn(`No current data available for ${channelName}`);
      return {
        sessions: { current: 0, change: 0 },
        conversions: { current: 0, change: 0 },
        revenue: { current: 0, change: 0 }
      };
    }

    const normalizedChannel = channelName.toLowerCase().replace(/\s+/g, '_');
    const currentData = analysis.current.channelGroupings?.[normalizedChannel];
    const previousData = analysis.previous?.channelGroupings?.[normalizedChannel];

    console.log(`Channel data for ${channelName}:`, { currentData, previousData });

    if (!currentData) {
      console.warn(`No current data found for channel: ${channelName}`);
      return {
        sessions: { current: 0, change: 0 },
        conversions: { current: 0, change: 0 },
        revenue: { current: 0, change: 0 }
      };
    }

    const calculateChange = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      sessions: {
        current: currentData.sessions || 0,
        change: calculateChange(currentData.sessions || 0, previousData?.sessions || 0)
      },
      conversions: {
        current: currentData.conversions || 0,
        change: calculateChange(currentData.conversions || 0, previousData?.conversions || 0)
      },
      revenue: {
        current: currentData.revenue || 0,
        change: calculateChange(currentData.revenue || 0, previousData?.revenue || 0)
      }
    };
  };

  const getTotalMetrics = (analysis: any) => {
    if (!analysis?.current?.channelGroupings?.total) {
      console.warn('No total metrics available');
      return {
        sessions: { current: 0, change: 0 },
        conversions: { current: 0, change: 0 },
        revenue: { current: 0, change: 0 }
      };
    }

    const currentTotal = analysis.current.channelGroupings.total;
    const previousTotal = analysis.previous?.channelGroupings?.total;

    const calculateChange = (current: number, previous: number) => {
      if (!previous) return 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      sessions: {
        current: currentTotal.sessions || 0,
        change: calculateChange(currentTotal.sessions || 0, previousTotal?.sessions || 0)
      },
      conversions: {
        current: currentTotal.conversions || 0,
        change: calculateChange(currentTotal.conversions || 0, previousTotal?.conversions || 0)
      },
      revenue: {
        current: currentTotal.revenue || 0,
        change: calculateChange(currentTotal.revenue || 0, previousTotal?.revenue || 0)
      }
    };
  };

  const monthlyData = analysisData?.report?.monthly_analysis;

  const renderMetricCards = (channelName: string | null = null) => {
    const metrics = channelName 
      ? getMetricsForChannel(monthlyData, channelName)
      : getTotalMetrics(monthlyData);

    if (!metrics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricOverviewCard
          title="Total Traffic"
          value={metrics.sessions.current}
          change={metrics.sessions.change}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricOverviewCard
          title="Total Conversions"
          value={metrics.conversions.current}
          change={metrics.conversions.change}
          icon={<LineChart className="h-4 w-4" />}
        />
        <MetricOverviewCard
          title="Revenue"
          value={metrics.revenue.current}
          change={metrics.revenue.change}
          icon={<Share2 className="h-4 w-4" />}
        />
      </div>
    );
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-6">
      <TabsList className="grid grid-cols-6 w-full">
        <TabsTrigger value="growth" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Growth
        </TabsTrigger>
        <TabsTrigger value="seo" className="flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          SEO
        </TabsTrigger>
        <TabsTrigger value="paid-social" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Paid Social
        </TabsTrigger>
        <TabsTrigger value="organic-social" className="flex items-center gap-2">
          <MessageSquareShare className="h-4 w-4" />
          Organic Social
        </TabsTrigger>
        <TabsTrigger value="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email
        </TabsTrigger>
        <TabsTrigger value="ppc" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          PPC
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Growth Overview</h2>
          {renderMetricCards()}
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <AnalysisResults report={analysisData?.report} isLoading={false} insights={insights} />
      </TabsContent>

      <TabsContent value="paid-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Paid Social Analytics</h2>
          {renderMetricCards('Paid Social')}
        </Card>
      </TabsContent>

      <TabsContent value="organic-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Organic Social Analytics</h2>
          {renderMetricCards('Organic Social')}
        </Card>
      </TabsContent>

      <TabsContent value="email" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Email Analytics</h2>
          {renderMetricCards('Email')}
        </Card>
      </TabsContent>

      <TabsContent value="ppc" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">PPC Analytics</h2>
          {renderMetricCards('Paid Search')}
        </Card>
      </TabsContent>
    </Tabs>
  );
}