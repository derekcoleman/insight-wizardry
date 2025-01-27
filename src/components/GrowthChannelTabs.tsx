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

  const getChannelData = (data: any, channelName: string) => {
    if (!data?.current?.channelData) return null;
    
    return data.current.channelData.find(
      (c: any) => c.channel.toLowerCase() === channelName.toLowerCase()
    );
  };

  const getChannelChanges = (data: any, channelName: string) => {
    if (!data?.changes?.channelData) return null;
    
    return data.changes.channelData.find(
      (c: any) => c.channel.toLowerCase() === channelName.toLowerCase()
    );
  };

  const getMetricsForChannel = (analysis: any, channelName: string) => {
    const currentData = getChannelData(analysis, channelName);
    const changes = getChannelChanges(analysis, channelName);

    return {
      sessions: {
        current: currentData?.sessions || 0,
        change: changes?.sessions || 0
      },
      conversions: {
        current: currentData?.conversions || 0,
        change: changes?.conversions || 0
      },
      revenue: {
        current: currentData?.revenue || 0,
        change: changes?.revenue || 0
      }
    };
  };

  const getTotalMetrics = (analysis: any) => {
    if (!analysis?.current) return null;
    
    return {
      sessions: {
        current: analysis.current.totalSessions || 0,
        change: analysis.changes?.totalSessions || 0
      },
      conversions: {
        current: analysis.current.totalConversions || 0,
        change: analysis.changes?.totalConversions || 0
      },
      revenue: {
        current: analysis.current.totalRevenue || 0,
        change: analysis.changes?.totalRevenue || 0
      }
    };
  };

  const monthlyData = analysisData?.report?.monthly_analysis;
  const quarterlyData = analysisData?.report?.quarterly_analysis;
  const ytdData = analysisData?.report?.ytd_analysis;
  const weeklyData = analysisData?.report?.weekly_analysis;

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
          {renderMetricCards('Paid Search')}
        </Card>
      </TabsContent>

      <TabsContent value="organic-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Organic Social Analytics</h2>
          {renderMetricCards('Social')}
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