import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

    // For the growth tab, return the complete analysis
    if (channelName === 'growth') return analysis;

    const channelMapping: { [key: string]: string } = {
      'organic-search': 'organic_search',
      'paid-social': 'paid_social',
      'organic-social': 'organic_social',
      'email': 'email',
      'paid-search': 'paid_search'
    };

    const normalizedChannel = channelMapping[channelName] || channelName.toLowerCase().replace(/\s+/g, '_');
    
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

    // For organic search, include search terms and pages data
    if (channelName === 'organic-search') {
      if (analysis.searchTerms) {
        filteredAnalysis.searchTerms = analysis.searchTerms;
      }
      if (analysis.pages) {
        filteredAnalysis.pages = analysis.pages;
      }
      if (analysis.domain) {
        filteredAnalysis.domain = analysis.domain;
      }
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
        channelName={getDisplayChannelName(channelName)}
      />
    );
  };

  const getDisplayChannelName = (channelName: string): string => {
    switch (channelName) {
      case 'growth':
        return 'Overall';
      case 'organic-search':
        return 'Organic Search';
      case 'paid-social':
        return 'Paid Social';
      case 'organic-social':
        return 'Organic Social';
      case 'email':
        return 'Email';
      case 'paid-search':
        return 'Paid Search';
      default:
        return channelName;
    }
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full space-y-6">
      <TabsList className="grid grid-cols-6 w-full">
        <TabsTrigger value="growth" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Growth
        </TabsTrigger>
        <TabsTrigger value="organic-search" className="flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Organic Search
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
        <TabsTrigger value="paid-search" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Paid Search
        </TabsTrigger>
      </TabsList>

      <TabsContent value="growth">
        {renderAnalysisForChannel('growth')}
      </TabsContent>

      <TabsContent value="organic-search">
        {renderAnalysisForChannel('organic-search')}
      </TabsContent>

      <TabsContent value="paid-social">
        {renderAnalysisForChannel('paid-social')}
      </TabsContent>

      <TabsContent value="organic-social">
        {renderAnalysisForChannel('organic-social')}
      </TabsContent>

      <TabsContent value="email">
        {renderAnalysisForChannel('email')}
      </TabsContent>

      <TabsContent value="paid-search">
        {renderAnalysisForChannel('paid-search')}
      </TabsContent>
    </Tabs>
  );
}
