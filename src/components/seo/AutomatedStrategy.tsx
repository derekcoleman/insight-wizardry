import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentTopicCard } from "./ContentTopicCard";
import { KeywordGapAnalysis } from "./KeywordGapAnalysis";
import { useNavigate } from "react-router-dom";

interface ContentTopic {
  title: string;
  description: string;
  targetKeywords: string[];
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
  pageUrl: string;
  currentMetrics?: {
    traffic?: number;
    conversions?: number;
    revenue?: number;
    [key: string]: any;
  } | null;
  implementationSteps: string[];
  conversionStrategy: string;
}

interface AnalysisData {
  searchTerms?: any[];
  pages?: any[];
}

interface AnalyticsReport {
  weekly_analysis: AnalysisData;
  monthly_analysis: AnalysisData;
  quarterly_analysis: AnalysisData;
  ytd_analysis: AnalysisData;
}

function generateRecommendedTopics(analysisData: AnalyticsReport | null): ContentTopic[] {
  if (!analysisData) return [];

  const searchTerms = [
    ...(analysisData.monthly_analysis?.searchTerms || []),
    ...(analysisData.quarterly_analysis?.searchTerms || []),
  ];

  const pages = [
    ...(analysisData.monthly_analysis?.pages || []),
    ...(analysisData.quarterly_analysis?.pages || []),
  ];

  // Extract unique keywords and their metrics
  const keywordMetrics = new Map();
  searchTerms.forEach(term => {
    if (!keywordMetrics.has(term.term)) {
      keywordMetrics.set(term.term, {
        clicks: term.current.clicks,
        impressions: term.current.impressions,
        ctr: parseFloat(term.current.ctr),
        position: parseFloat(term.current.position)
      });
    }
  });

  // Group related keywords
  const keywordGroups = Array.from(keywordMetrics.entries())
    .reduce((groups: any, [keyword, metrics]: [string, any]) => {
      const words = keyword.toLowerCase().split(' ');
      const mainTopic = words[0];
      if (!groups[mainTopic]) {
        groups[mainTopic] = {
          keywords: [],
          totalClicks: 0,
          totalImpressions: 0
        };
      }
      groups[mainTopic].keywords.push({
        keyword,
        metrics
      });
      groups[mainTopic].totalClicks += metrics.clicks;
      groups[mainTopic].totalImpressions += metrics.impressions;
      return groups;
    }, {});

  // Convert groups to content topics
  return Object.entries(keywordGroups)
    .sort(([, a]: [string, any], [, b]: [string, any]) => b.totalImpressions - a.totalImpressions)
    .slice(0, 10)
    .map(([topic, data]: [string, any]) => {
      const relatedKeywords = data.keywords
        .sort((a: any, b: any) => b.metrics.impressions - a.metrics.impressions)
        .slice(0, 5);

      const avgPosition = relatedKeywords.reduce((sum: number, k: any) => 
        sum + k.metrics.position, 0) / relatedKeywords.length;

      const priority: 'high' | 'medium' | 'low' = avgPosition <= 20 ? 'high' : 
        avgPosition <= 40 ? 'medium' : 'low';

      return {
        title: `Comprehensive Guide to ${topic.charAt(0).toUpperCase() + topic.slice(1)}`,
        description: `Create an in-depth guide covering ${topic} based on search demand. Focus on addressing user questions and pain points revealed through search patterns.`,
        targetKeywords: relatedKeywords.map((k: any) => k.keyword),
        estimatedImpact: `Potential to capture ${data.totalImpressions.toLocaleString()} monthly impressions based on current search volume.`,
        priority,
        pageUrl: 'new',
        currentMetrics: null,
        implementationSteps: [
          'Research competitor content structure',
          'Create comprehensive outline',
          'Develop detailed content addressing key user questions',
          'Optimize for featured snippets',
          'Include relevant internal links'
        ],
        conversionStrategy: `Target users in the research phase looking for ${topic} information. Include clear CTAs and relevant product recommendations.`
      };
    });
}

export function AutomatedStrategy() {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [contentTopics, setContentTopics] = useState<ContentTopic[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalyticsReport | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const storedReport = localStorage.getItem('analysisReport');
    const storedStrategy = localStorage.getItem('generatedStrategy');

    if (storedReport) {
      const report = JSON.parse(storedReport);
      setAnalysisData(report);
      // Generate recommended topics based on analysis data
      const recommendations = generateRecommendedTopics(report);
      setContentTopics(recommendations);
    }

    if (storedStrategy) {
      const strategy = JSON.parse(storedStrategy);
      if (strategy.topics) {
        setContentTopics(prev => [...prev, ...strategy.topics]);
      }
    }
  }, []);

  const generateStrategy = async () => {
    if (!analysisData) {
      toast({
        title: "No Analysis Data",
        description: "Please run a complete analysis first.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    const hasSearchData = analysisData && (
      (analysisData.monthly_analysis?.searchTerms?.length > 0) ||
      (analysisData.quarterly_analysis?.searchTerms?.length > 0) ||
      (analysisData.ytd_analysis?.searchTerms?.length > 0)
    );

    if (!hasSearchData) {
      toast({
        title: "No Search Console Data",
        description: "Please run a complete analysis with Search Console data first.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setIsLoading(true);
    try {
      const analysisInput = {
        ga4Data: {
          monthly: analysisData.monthly_analysis,
          quarterly: analysisData.quarterly_analysis,
          ytd: analysisData.ytd_analysis
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

      const response = await supabase.functions.invoke('generate-seo-strategy', {
        body: analysisInput
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate strategy');
      }

      setContentTopics(response.data.topics);
      localStorage.setItem('generatedStrategy', JSON.stringify(response.data));
      
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

  const handleExportToDoc = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-strategy-doc', {
        body: { topics: contentTopics }
      });

      if (error) throw error;

      if (data.docUrl) {
        window.open(data.docUrl, '_blank');
        toast({
          title: "Success",
          description: "Strategy document created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create strategy document",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Automated Content Strategy</CardTitle>
          <Button 
            onClick={handleExportToDoc} 
            disabled={isExporting}
            variant="outline"
            className="ml-2"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Export to Google Doc
          </Button>
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
              Please run a complete analysis first.
            </p>
          )}
        </CardContent>
      </Card>

      <KeywordGapAnalysis analysisData={analysisData} />

      {contentTopics.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Content Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTopics.map((topic, index) => (
              <ContentTopicCard key={index} topic={topic} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}