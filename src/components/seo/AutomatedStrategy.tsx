import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentTopicCard } from "./ContentTopicCard";
import { KeywordGapAnalysis } from "./KeywordGapAnalysis";

interface ContentTopic {
  title: string;
  description: string;
  targetKeywords: string[];
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

interface AnalyticsReport {
  weekly_analysis: {
    searchTerms?: any[];
    pages?: any[];
  };
  monthly_analysis: {
    searchTerms?: any[];
    pages?: any[];
  };
  quarterly_analysis: {
    searchTerms?: any[];
    pages?: any[];
  };
  yoy_analysis: {
    searchTerms?: any[];
    pages?: any[];
  };
}

export function AutomatedStrategy() {
  const [isLoading, setIsLoading] = useState(false);
  const [contentTopics, setContentTopics] = useState<ContentTopic[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalyticsReport | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLatestAnalysis = async () => {
      try {
        const { data: reportData, error: reportError } = await supabase
          .from('analytics_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (reportError) {
          console.error('Failed to fetch analytics data:', reportError);
          return;
        }

        if (!reportData || reportData.length === 0) {
          console.log('No analytics data available');
          return;
        }

        // Map yoy_analysis to match our interface
        const mappedData: AnalyticsReport = {
          weekly_analysis: reportData[0].weekly_analysis,
          monthly_analysis: reportData[0].monthly_analysis,
          quarterly_analysis: reportData[0].quarterly_analysis,
          yoy_analysis: reportData[0].yoy_analysis,
        };

        setAnalysisData(mappedData);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
      }
    };

    fetchLatestAnalysis();
  }, []);

  const generateStrategy = async () => {
    if (!analysisData) {
      toast({
        title: "No Analysis Data",
        description: "Please run an analysis first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const analysisInput = {
        ga4Data: {
          monthly: analysisData.monthly_analysis,
          quarterly: analysisData.quarterly_analysis,
          yoy: analysisData.yoy_analysis
        },
        gscData: {
          searchTerms: analysisData.weekly_analysis?.searchTerms || [],
          pages: analysisData.weekly_analysis?.pages || [],
          monthlySearchTerms: analysisData.monthly_analysis?.searchTerms || [],
          monthlyPages: analysisData.monthly_analysis?.pages || [],
          quarterlySearchTerms: analysisData.quarterly_analysis?.searchTerms || [],
          quarterlyPages: analysisData.quarterly_analysis?.pages || [],
        }
      };

      console.log('Sending analysis data to strategy generator:', analysisInput);

      const response = await supabase.functions.invoke('generate-seo-strategy', {
        body: analysisInput
      });

      if (response.error) {
        console.error('Strategy generation error:', response.error);
        throw new Error(response.error.message || 'Failed to generate strategy');
      }

      if (!response.data?.topics) {
        throw new Error('No topics generated');
      }

      setContentTopics(response.data.topics);
      toast({
        title: "Strategy Generated",
        description: "Your SEO content strategy has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate SEO strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Content Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Generate content recommendations based on your Google Analytics and Search Console data.
          </p>
          <Button 
            onClick={generateStrategy} 
            disabled={isLoading || !analysisData}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Strategy
          </Button>
          {!analysisData && (
            <p className="text-sm text-red-500 mt-2">
              No analysis data available. Please run an analysis first.
            </p>
          )}
        </CardContent>
      </Card>

      <KeywordGapAnalysis analysisData={analysisData} />

      {contentTopics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentTopics.map((topic, index) => (
            <ContentTopicCard key={index} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}