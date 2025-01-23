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
    searchTerms?: string[];
  } | null;
  monthly_analysis: any;
  quarterly_analysis: any;
  yoy_analysis: any;
}

export function AutomatedStrategy() {
  const [isLoading, setIsLoading] = useState(false);
  const [contentTopics, setContentTopics] = useState<ContentTopic[]>([]);
  const { toast } = useToast();

  const generateStrategy = async () => {
    setIsLoading(true);
    try {
      // Get the latest GA4 and GSC data from our analytics_reports table
      const { data: reportData, error: reportError } = await supabase
        .from('analytics_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (reportError) {
        console.error('Failed to fetch analytics data:', reportError);
        throw new Error('Failed to fetch analytics data');
      }

      if (!reportData || reportData.length === 0) {
        throw new Error('No analytics data available. Please run an analysis first.');
      }

      const latestReport = reportData[0] as AnalyticsReport;
      
      const analysisData = {
        ga4Data: {
          monthly: latestReport.monthly_analysis,
          quarterly: latestReport.quarterly_analysis,
          yoy: latestReport.yoy_analysis
        },
        gscData: latestReport.weekly_analysis?.searchTerms || []
      };

      console.log('Sending analysis data to strategy generator:', analysisData);

      const response = await supabase.functions.invoke('generate-seo-strategy', {
        body: analysisData
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
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Strategy
          </Button>
        </CardContent>
      </Card>

      <KeywordGapAnalysis />

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