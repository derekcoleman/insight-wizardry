import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AnalysisResults } from "./AnalysisResults";
import { LineChart, BarChart3, Share2, MessageSquareShare, TrendingUp, Mail } from "lucide-react";
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

  const filterAnalysisForChannel = (analysis: any, channelName: string) => {
    if (!analysis) return null;

    const normalizedChannel = channelName.toLowerCase().replace(/\s+/g, '_');
    
    // Create a new analysis object focused on the specific channel
    const filteredAnalysis = {
      ...analysis,
      current: {
        ...analysis.current,
        sessions: analysis.current?.channelGroupings?.[normalizedChannel]?.sessions || 0,
        conversions: analysis.current?.channelGroupings?.[normalizedChannel]?.conversions || 0,
        revenue: analysis.current?.channelGroupings?.[normalizedChannel]?.revenue || 0,
        channelGroupings: {
          [normalizedChannel]: analysis.current?.channelGroupings?.[normalizedChannel] || {}
        }
      },
      previous: {
        ...analysis.previous,
        sessions: analysis.previous?.channelGroupings?.[normalizedChannel]?.sessions || 0,
        conversions: analysis.previous?.channelGroupings?.[normalizedChannel]?.conversions || 0,
        revenue: analysis.previous?.channelGroupings?.[normalizedChannel]?.revenue || 0,
        channelGroupings: {
          [normalizedChannel]: analysis.previous?.channelGroupings?.[normalizedChannel] || {}
        }
      }
    };

    // Keep the period and summary information
    if (analysis.period) {
      filteredAnalysis.period = analysis.period;
    }

    return filteredAnalysis;
  };

  const renderAnalysisForChannel = (channelName: string) => {
    if (!analysisData?.report) return null;

    // Create a filtered version of the report focused on the specific channel
    const filteredReport = {
      weekly_analysis: filterAnalysisForChannel(analysisData.report.weekly_analysis, channelName),
      monthly_analysis: filterAnalysisForChannel(analysisData.report.monthly_analysis, channelName),
      quarterly_analysis: filterAnalysisForChannel(analysisData.report.quarterly_analysis, channelName),
      ytd_analysis: filterAnalysisForChannel(analysisData.report.ytd_analysis, channelName),
      last28_yoy_analysis: filterAnalysisForChannel(analysisData.report.last28_yoy_analysis, channelName)
    };

    return (
      <AnalysisResults 
        report={filteredReport} 
        isLoading={false} 
        insights={insights} 
      />
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

      <TabsContent value="growth">
        <AnalysisResults report={analysisData?.report} isLoading={false} insights={insights} />
      </TabsContent>

      <TabsContent value="seo">
        {renderAnalysisForChannel('Organic Search')}
      </TabsContent>

      <TabsContent value="paid-social">
        {renderAnalysisForChannel('Paid Social')}
      </TabsContent>

      <TabsContent value="organic-social">
        {renderAnalysisForChannel('Organic Social')}
      </TabsContent>

      <TabsContent value="email">
        {renderAnalysisForChannel('Email')}
      </TabsContent>

      <TabsContent value="ppc">
        {renderAnalysisForChannel('Paid Search')}
      </TabsContent>
    </Tabs>
  );
}