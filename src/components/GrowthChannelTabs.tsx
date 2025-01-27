import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { GoogleConnect } from "./GoogleConnect";
import { LineChart, BarChart3, Share2, MessageSquareShare, TrendingUp } from "lucide-react";
import { MetricCard } from "./MetricOverviewCard";

interface GrowthChannelTabsProps {
  defaultTab?: string;
}

export function GrowthChannelTabs({ defaultTab = "overview" }: GrowthChannelTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-6">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Overview
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

      <TabsContent value="overview" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Growth Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Traffic"
              value="--"
              change={0}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <MetricCard
              title="Total Conversions"
              value="--"
              change={0}
              icon={<LineChart className="h-4 w-4" />}
            />
            <MetricCard
              title="Social Engagement"
              value="--"
              change={0}
              icon={<Share2 className="h-4 w-4" />}
            />
            <MetricCard
              title="Ad Spend"
              value="--"
              change={0}
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <GoogleConnect />
      </TabsContent>

      <TabsContent value="paid-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Paid Social Analytics</h2>
          <p className="text-muted-foreground">
            Connect your social media advertising accounts to view performance metrics and generate reports.
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="organic-social" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Organic Social Analytics</h2>
          <p className="text-muted-foreground">
            Connect your social media accounts to track engagement, reach, and content performance.
          </p>
        </Card>
      </TabsContent>

      <TabsContent value="ppc" className="space-y-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">PPC Analytics</h2>
          <p className="text-muted-foreground">
            Connect your advertising accounts to analyze campaign performance and ROI.
          </p>
        </Card>
      </TabsContent>
    </Tabs>
  );
}