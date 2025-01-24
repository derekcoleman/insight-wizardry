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

  const allSearchTerms = [
    ...(analysisData.monthly_analysis?.searchTerms || []),
    ...(analysisData.quarterly_analysis?.searchTerms || []),
    ...(analysisData.ytd_analysis?.searchTerms || [])
  ];

  // Group related search terms
  const keywordGroups = allSearchTerms.reduce((groups: any, term: any) => {
    const words = term.term.split(' ');
    const mainKeyword = words[0];
    if (!groups[mainKeyword]) {
      groups[mainKeyword] = {
        terms: [],
        totalClicks: 0,
        avgPosition: 0,
        relatedWords: new Set()
      };
    }
    groups[mainKeyword].terms.push(term);
    groups[mainKeyword].totalClicks += term.current.clicks;
    groups[mainKeyword].avgPosition += parseFloat(term.current.position);
    words.slice(1).forEach((word: string) => groups[mainKeyword].relatedWords.add(word));
    return groups;
  }, {});

  // Convert groups to varied content topics
  return Object.entries(keywordGroups)
    .map(([keyword, data]: [string, any]) => {
      const avgPosition = data.avgPosition / data.terms.length;
      const relatedTerms = data.terms.map((t: any) => t.term);
      const relatedWords = Array.from(data.relatedWords);
      
      const priority: 'high' | 'medium' | 'low' = 
        avgPosition > 20 ? 'high' :
        avgPosition > 10 ? 'medium' : 'low';

      // Generate varied content types based on data patterns
      const contentTypes = [
        {
          prefix: "Ultimate Guide:",
          format: `Ultimate Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} ${relatedWords.slice(0, 2).join(' ')}`
        },
        {
          prefix: "How-to:",
          format: `How to ${keyword} ${relatedWords.slice(0, 2).join(' ')} Like a Pro`
        },
        {
          prefix: "Tips:",
          format: `${data.terms.length} Essential ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Tips for ${relatedWords.slice(0, 2).join(' ')}`
        },
        {
          prefix: "Strategy:",
          format: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Strategy: ${relatedWords.slice(0, 2).join(' ')} Guide`
        },
        {
          prefix: "Best Practices:",
          format: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Best Practices for ${relatedWords.slice(0, 2).join(' ')}`
        }
      ];

      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      
      return {
        title: contentType.format,
        description: `Create actionable content about ${keyword} focusing on ${relatedTerms.slice(0, 3).join(', ')}. This content addresses specific user needs and search intent around ${keyword}.`,
        targetKeywords: relatedTerms,
        estimatedImpact: `Current average position: ${avgPosition.toFixed(1)}. Opportunity to improve rankings for ${relatedTerms.length} related keywords with ${data.totalClicks} total clicks. High potential for traffic growth.`,
        priority,
        pageUrl: 'new',
        implementationSteps: [
          `Research top-performing content for "${keyword}" related searches`,
          `Create detailed content addressing user intent for ${relatedTerms.slice(0, 3).join(', ')}`,
          'Structure content with clear headings and subheadings',
          'Include relevant examples and case studies',
          'Add data-driven insights and statistics',
          'Optimize meta title and description',
          'Include relevant internal and external links'
        ],
        conversionStrategy: `Target users searching for ${keyword}-related information with clear calls-to-action and relevant conversion points throughout the content.`
      };
    })
    .sort((a: ContentTopic, b: ContentTopic) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 10); // Limit to top 10 opportunities
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
      setAnalysisData(JSON.parse(storedReport));
    }

    if (storedStrategy) {
      const strategy = JSON.parse(storedStrategy);
      if (strategy.topics) {
        setContentTopics(strategy.topics);
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
    const topics = contentTopics.length > 0 ? contentTopics : generateRecommendedTopics(analysisData).map(topic => ({
      title: topic.title,
      description: topic.description,
      targetKeywords: topic.targetKeywords,
      estimatedImpact: topic.estimatedImpact,
      priority: topic.priority,
      pageUrl: topic.pageUrl,
      implementationSteps: topic.implementationSteps,
      conversionStrategy: topic.conversionStrategy
    }));

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-strategy-doc', {
        body: { topics }
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
          <h2 className="text-2xl font-bold">Generated Content Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTopics.map((topic, index) => (
              <ContentTopicCard key={index} topic={topic} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold mt-8">Recommended Content Ideas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generateRecommendedTopics(analysisData).map((topic, index) => (
            <ContentTopicCard 
              key={`recommended-${index}`} 
              topic={topic}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
