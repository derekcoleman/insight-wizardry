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
  const monthlyData = analysisData?.report?.monthly_analysis;

  useEffect(() => {
    if (analysisData?.report) {
      setInsights(analysisData.report.insights || null);
    }
  }, [analysisData]);

  const filterDataByChannel = (data: any, channel: string) => {
    if (!data?.current?.channelData) return null;
    
    const channelData = data.current.channelData.find(
      (c: any) => c.channel.toLowerCase() === channel.toLowerCase()
    );

    return channelData ? {
      current: channelData,
      changes: data.changes?.channelData?.find(
        (c: any) => c.channel.toLowerCase() === channel.toLowerCase()
      ) || {}
    } : null;
  };

  const getOverallData = (data: any) => {
    if (!data?.current) return null;
    return {
      current: {
        sessions: data.current.totalSessions || 0,
        conversions: data.current.totalConversions || 0,
        revenue: data.current.totalRevenue || 0,
      },
      changes: {
        sessions: data.changes?.totalSessions || 0,
        conversions: data.changes?.totalConversions || 0,
        revenue: data.changes?.totalRevenue || 0,
      }
    };
  };

  const paidSearchData = filterDataByChannel(monthlyData, 'Paid Search');
  const organicSocialData = filterDataByChannel(monthlyData, 'Social');
  const emailData = filterDataByChannel(monthlyData, 'Email');
  const overallData = getOverallData(monthlyData);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricOverviewCard
              title="Total Traffic"
              value={overallData?.current?.sessions || 0}
              change={overallData?.changes?.sessions || 0}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Total Conversions"
              value={overallData?.current?.conversions || 0}
              change={overallData?.changes?.conversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Revenue"
              value={overallData?.current?.revenue || 0}
              change={overallData?.changes?.revenue || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <AnalysisResults report={analysisData?.report} isLoading={false} insights={insights} />
      </TabsContent>

      <TabsContent value="paid-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Paid Social Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricOverviewCard
              title="Sessions"
              value={paidSearchData?.current?.sessions || 0}
              change={paidSearchData?.changes?.sessions || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Conversions"
              value={paidSearchData?.current?.conversions || 0}
              change={paidSearchData?.changes?.conversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Revenue"
              value={paidSearchData?.current?.revenue || 0}
              change={paidSearchData?.changes?.revenue || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="organic-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Organic Social Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricOverviewCard
              title="Sessions"
              value={organicSocialData?.current?.sessions || 0}
              change={organicSocialData?.changes?.sessions || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Conversions"
              value={organicSocialData?.current?.conversions || 0}
              change={organicSocialData?.changes?.conversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Revenue"
              value={organicSocialData?.current?.revenue || 0}
              change={organicSocialData?.changes?.revenue || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="email" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Email Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricOverviewCard
              title="Sessions"
              value={emailData?.current?.sessions || 0}
              change={emailData?.changes?.sessions || 0}
              icon={<Mail className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Conversions"
              value={emailData?.current?.conversions || 0}
              change={emailData?.changes?.conversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Revenue"
              value={emailData?.current?.revenue || 0}
              change={emailData?.changes?.revenue || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="ppc" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">PPC Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricOverviewCard
              title="Sessions"
              value={paidSearchData?.current?.sessions || 0}
              change={paidSearchData?.changes?.sessions || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Conversions"
              value={paidSearchData?.current?.conversions || 0}
              change={paidSearchData?.changes?.conversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricOverviewCard
              title="Revenue"
              value={paidSearchData?.current?.revenue || 0}
              change={paidSearchData?.changes?.revenue || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}