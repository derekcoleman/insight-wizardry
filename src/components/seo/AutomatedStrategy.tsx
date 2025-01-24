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

  // Get all search terms across different time periods
  const allSearchTerms = [
    ...(analysisData.monthly_analysis?.searchTerms || []),
    ...(analysisData.quarterly_analysis?.searchTerms || []),
    ...(analysisData.ytd_analysis?.searchTerms || [])
  ];

  // Get existing optimized keywords to avoid duplicates
  const existingKeywords = new Set(
    allSearchTerms
      .slice(0, 10)
      .map(term => term.term.toLowerCase())
  );

  // Group related search terms, excluding exact matches of existing keywords
  const keywordGroups = allSearchTerms
    .filter(term => !existingKeywords.has(term.term.toLowerCase()))
    .reduce((groups: any, term: any) => {
      const words = term.term.split(' ');
      const mainKeyword = words[0];
      if (!groups[mainKeyword]) {
        groups[mainKeyword] = {
          terms: [],
          totalClicks: 0,
          avgPosition: 0,
          relatedWords: new Set(),
          impressions: 0
        };
      }
      groups[mainKeyword].terms.push(term);
      groups[mainKeyword].totalClicks += term.current.clicks;
      groups[mainKeyword].avgPosition += parseFloat(term.current.position);
      groups[mainKeyword].impressions += term.current.impressions;
      words.slice(1).forEach((word: string) => groups[mainKeyword].relatedWords.add(word));
      return groups;
    }, {});

  // Content type templates with more variety
  const contentTypes = [
    {
      format: (keyword: string, words: string[]) => 
        `THE ULTIMATE ${keyword.toUpperCase()} ${words.slice(0, 2).join(' ').toUpperCase()} GUIDE FOR 2024`,
      condition: (data: any) => data.impressions > 5000
    },
    {
      format: (keyword: string, words: string[]) => 
        `${data.terms.length} PROVEN ${keyword.toUpperCase()} ${words[0].toUpperCase()} STRATEGIES THAT WORK`,
      condition: (data: any) => data.terms.length > 5
    },
    {
      format: (keyword: string, words: string[]) => 
        `HOW TO MASTER ${keyword.toUpperCase()} ${words.slice(0, 2).join(' ').toUpperCase()}: EXPERT TIPS`,
      condition: (data: any) => data.avgPosition > 15
    },
    {
      format: (keyword: string, words: string[]) => 
        `${keyword.toUpperCase()} ${words.slice(0, 2).join(' ').toUpperCase()}: INDUSTRY BEST PRACTICES`,
      condition: (data: any) => data.totalClicks > 100
    },
    {
      format: (keyword: string, words: string[]) => 
        `TOP 10 ${keyword.toUpperCase()} ${words[0].toUpperCase()} MISTAKES TO AVOID`,
      condition: (data: any) => true
    },
    {
      format: (keyword: string, words: string[]) => 
        `MAXIMIZING ${keyword.toUpperCase()} ${words.slice(0, 2).join(' ').toUpperCase()} ROI`,
      condition: (data: any) => data.impressions > 1000
    },
    {
      format: (keyword: string, words: string[]) => 
        `${keyword.toUpperCase()} ${words[0].toUpperCase()} CHECKLIST: STEP-BY-STEP GUIDE`,
      condition: (data: any) => true
    },
    {
      format: (keyword: string, words: string[]) => 
        `COMPARING THE BEST ${keyword.toUpperCase()} ${words[0].toUpperCase()} SOLUTIONS`,
      condition: (data: any) => data.terms.length > 3
    },
    {
      format: (keyword: string, words: string[]) => 
        `${keyword.toUpperCase()} ${words[0].toUpperCase()}: FROM BEGINNER TO EXPERT`,
      condition: (data: any) => true
    },
    {
      format: (keyword: string, words: string[]) => 
        `ESSENTIAL ${keyword.toUpperCase()} ${words.slice(0, 2).join(' ').toUpperCase()} METRICS TO TRACK`,
      condition: (data: any) => data.impressions > 2000
    }
  ];

  // Convert groups to varied content topics
  return Object.entries(keywordGroups)
    .flatMap(([keyword, data]: [string, any]) => {
      const avgPosition = data.avgPosition / data.terms.length;
      const relatedTerms = data.terms.map((t: any) => t.term);
      const relatedWords = Array.from(data.relatedWords);
      
      const priority: 'high' | 'medium' | 'low' = 
        avgPosition > 20 ? 'high' :
        avgPosition > 10 ? 'medium' : 'low';

      // Generate multiple content ideas for each keyword group
      return contentTypes
        .filter(type => type.condition(data))
        .slice(0, 2) // Take up to 2 content types per keyword group
        .map(type => ({
          title: type.format(keyword, Array.from(relatedWords)),
          description: `Create comprehensive, data-driven content focusing on ${relatedTerms.slice(0, 3).join(', ')}. Address specific pain points and questions around ${keyword} while incorporating industry insights and expert perspectives.`,
          targetKeywords: relatedTerms,
          estimatedImpact: `Current average position: ${avgPosition.toFixed(1)}. High-value opportunity with ${data.impressions.toLocaleString()} impressions and ${data.totalClicks} clicks. Potential to capture significant traffic share in the ${keyword} space.`,
          priority,
          pageUrl: 'new',
          implementationSteps: [
            `Research current trends and best practices in ${keyword} industry`,
            'Create detailed content outline incorporating key subtopics',
            'Include expert insights and industry statistics',
            'Add relevant case studies and examples',
            'Optimize for featured snippets and rich results',
            'Create custom visuals and infographics',
            'Implement strategic internal linking'
          ],
          conversionStrategy: `Implement targeted conversion points throughout the content, focusing on user intent stages. Include relevant CTAs, downloadable resources, and consultation opportunities.`
        }));
    })
    .sort((a: ContentTopic, b: ContentTopic) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 10);
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
