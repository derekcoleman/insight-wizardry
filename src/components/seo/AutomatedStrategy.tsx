import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
  yoy_analysis: AnalysisData;
}

const recommendedTopics = [
  {
    title: "Ultimate Guide to SEO Analytics",
    description: "Comprehensive guide covering key metrics, tools, and strategies for measuring SEO success",
    targetKeywords: "seo analytics, seo metrics, seo measurement",
    priority: "high",
    targetAudience: "Marketing Managers, SEO Specialists",
    funnelStage: "awareness"
  },
  {
    title: "ROI Calculator for SEO Investments",
    description: "Interactive tool to help businesses calculate potential returns on SEO investments",
    targetKeywords: "seo roi, seo investment calculator, seo returns",
    priority: "high",
    targetAudience: "Business Owners, Marketing Directors",
    funnelStage: "consideration"
  },
  {
    title: "Local SEO Success Stories",
    description: "Case studies of successful local businesses improving their search visibility",
    targetKeywords: "local seo examples, local seo case studies",
    priority: "medium",
    targetAudience: "Small Business Owners",
    funnelStage: "decision"
  },
  {
    title: "SEO for E-commerce Product Pages",
    description: "Best practices for optimizing e-commerce product pages for search engines",
    targetKeywords: "ecommerce seo, product page optimization",
    priority: "high",
    targetAudience: "E-commerce Managers",
    funnelStage: "consideration"
  },
  {
    title: "Voice Search Optimization Guide",
    description: "How to optimize content for voice search and virtual assistants",
    targetKeywords: "voice search seo, voice search optimization",
    priority: "medium",
    targetAudience: "Digital Marketers",
    funnelStage: "awareness"
  },
  {
    title: "SEO Audit Checklist Template",
    description: "Downloadable template for conducting comprehensive SEO audits",
    targetKeywords: "seo audit template, seo checklist",
    priority: "high",
    targetAudience: "SEO Consultants, In-house SEO Teams",
    funnelStage: "consideration"
  },
  {
    title: "Mobile SEO Implementation Guide",
    description: "Step-by-step guide to implementing mobile-first SEO strategies",
    targetKeywords: "mobile seo, mobile-first indexing",
    priority: "high",
    targetAudience: "Web Developers, SEO Specialists",
    funnelStage: "consideration"
  },
  {
    title: "International SEO Strategy Blueprint",
    description: "Complete guide to expanding SEO efforts globally",
    targetKeywords: "international seo, global seo strategy",
    priority: "medium",
    targetAudience: "Enterprise Marketing Teams",
    funnelStage: "decision"
  },
  {
    title: "SEO Tools Comparison Guide",
    description: "Detailed comparison of popular SEO tools and their features",
    targetKeywords: "seo tools comparison, best seo tools",
    priority: "medium",
    targetAudience: "Marketing Professionals",
    funnelStage: "consideration"
  },
  {
    title: "SEO ROI Case Studies",
    description: "Real-world examples of businesses achieving significant ROI through SEO",
    targetKeywords: "seo success stories, seo case studies",
    priority: "high",
    targetAudience: "C-Level Executives",
    funnelStage: "decision"
  }
];

export function AutomatedStrategy() {
  const [isLoading, setIsLoading] = useState(false);
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
      (analysisData.yoy_analysis?.searchTerms?.length > 0)
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
          {recommendedTopics.map((topic, index) => (
            <ContentTopicCard 
              key={`recommended-${index}`} 
              topic={{
                title: topic.title,
                description: topic.description,
                targetKeywords: topic.targetKeywords.split(', '),
                estimatedImpact: `Target Audience: ${topic.targetAudience}\nFunnel Stage: ${topic.funnelStage}`,
                priority: topic.priority,
                pageUrl: 'new',
                implementationSteps: [`Target Audience: ${topic.targetAudience}`, `Funnel Stage: ${topic.funnelStage}`],
                conversionStrategy: `Optimized for ${topic.targetAudience} at the ${topic.funnelStage} stage`
              }} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
