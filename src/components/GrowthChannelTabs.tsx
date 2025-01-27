import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AnalysisResults } from "./AnalysisResults";
import { LineChart, BarChart3, Share2, MessageSquareShare, TrendingUp } from "lucide-react";
import { MetricCard } from "./MetricOverviewCard";
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

  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-6">
      <TabsList className="grid grid-cols-5 w-full">
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
        <TabsTrigger value="ppc" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          PPC
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Growth Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Traffic"
              value={monthlyData?.current?.sessions || 0}
              change={monthlyData?.changes?.sessions || 0}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              title="Total Conversions"
              value={monthlyData?.current?.conversions || 0}
              change={monthlyData?.changes?.conversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricCard
              title="Social Engagement"
              value={monthlyData?.current?.socialEngagement || 0}
              change={monthlyData?.changes?.socialEngagement || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Ad Spend"
              value={monthlyData?.current?.adSpend || 0}
              change={monthlyData?.changes?.adSpend || 0}
              icon={<BarChart3 className="h-4 w-4" />}
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
            <MetricCard
              title="Ad Spend"
              value={monthlyData?.current?.paidSocialSpend || 0}
              change={monthlyData?.changes?.paidSocialSpend || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              title="Impressions"
              value={monthlyData?.current?.paidSocialImpressions || 0}
              change={monthlyData?.changes?.paidSocialImpressions || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Clicks"
              value={monthlyData?.current?.paidSocialClicks || 0}
              change={monthlyData?.changes?.paidSocialClicks || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Conversions"
              value={monthlyData?.current?.paidSocialConversions || 0}
              change={monthlyData?.changes?.paidSocialConversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
          </div>
          <AnalysisResults report={analysisData?.report} isLoading={false} insights={insights} />
        </Card>
      </TabsContent>

      <TabsContent value="organic-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Organic Social Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Engagement Rate"
              value={monthlyData?.current?.organicSocialEngagement || 0}
              change={monthlyData?.changes?.organicSocialEngagement || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Reach"
              value={monthlyData?.current?.organicSocialReach || 0}
              change={monthlyData?.changes?.organicSocialReach || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Followers"
              value={monthlyData?.current?.organicSocialFollowers || 0}
              change={monthlyData?.changes?.organicSocialFollowers || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Posts"
              value={monthlyData?.current?.organicSocialPosts || 0}
              change={monthlyData?.changes?.organicSocialPosts || 0}
              icon={<MessageSquareShare className="h-4 w-4" />}
            />
          </div>
          <AnalysisResults report={analysisData?.report} isLoading={false} insights={insights} />
        </Card>
      </TabsContent>

      <TabsContent value="ppc" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">PPC Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ad Spend"
              value={monthlyData?.current?.ppcSpend || 0}
              change={monthlyData?.changes?.ppcSpend || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              title="Clicks"
              value={monthlyData?.current?.ppcClicks || 0}
              change={monthlyData?.changes?.ppcClicks || 0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Conversions"
              value={monthlyData?.current?.ppcConversions || 0}
              change={monthlyData?.changes?.ppcConversions || 0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricCard
              title="Cost per Click"
              value={monthlyData?.current?.ppcCpc || 0}
              change={monthlyData?.changes?.ppcCpc || 0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
          <AnalysisResults report={analysisData?.report} isLoading={false} insights={insights} />
        </Card>
      </TabsContent>
    </Tabs>
  );
}