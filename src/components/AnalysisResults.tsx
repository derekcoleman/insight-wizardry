import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisInsights } from "./AnalysisInsights";
import { AnalysisCard } from "./analysis/AnalysisCard";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "./ui/use-toast";
import { ExportButtons } from "./analysis/ExportButtons";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface AnalysisResultsProps {
  report: {
    weekly_analysis: any;
    monthly_analysis: any;
    quarterly_analysis: any;
    ytd_analysis: any;
    last28_yoy_analysis: any;
  } | null;
  isLoading: boolean;
  insights?: string | null;
  channelName?: string;
}

// Cache for storing generated insights per channel
const insightsCache = new Map<string, string>();

export function AnalysisResults({ report, isLoading, insights: providedInsights, channelName = 'Overall' }: AnalysisResultsProps) {
  const [insights, setInsights] = useState<string>(providedInsights || "");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const generateInsights = async () => {
      if (!report || isLoading || providedInsights) return;
      
      // Check if we have cached insights for this channel
      const cacheKey = `${channelName}-${JSON.stringify(report)}`;
      if (insightsCache.has(cacheKey)) {
        setInsights(insightsCache.get(cacheKey)!);
        return;
      }
      
      setIsGeneratingInsights(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-insights', {
          body: { 
            data: report,
            channel: channelName 
          }
        });

        if (error) throw error;
        
        // Cache the insights for this channel
        insightsCache.set(cacheKey, data.insights);
        setInsights(data.insights);

        // Save to search history
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const searchHistoryEntry = {
            type: channelName,
            timestamp: new Date().toISOString(),
            insights: data.insights
          };

          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              search_history: searchHistoryEntry
            })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Error updating search history:', updateError);
          }
        }
      } catch (error) {
        console.error('Error generating insights:', error);
      } finally {
        setIsGeneratingInsights(false);
      }
    };

    generateInsights();
  }, [report, isLoading, providedInsights, channelName]);

  const handleCreateDoc = async () => {
    if (!report) return;

    setIsCreatingDoc(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-report-doc', {
        body: { 
          report,
          insights 
        }
      });

      if (error) throw error;

      if (data.docUrl) {
        window.open(data.docUrl, '_blank');
        toast({
          title: "Success",
          description: "Report document created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create report document",
        variant: "destructive",
      });
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleCreatePdf = async () => {
    if (!report) return;

    setIsCreatingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-report-pdf', {
        body: { 
          report,
          insights 
        }
      });

      if (error) throw error;

      if (data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        toast({
          title: "Success",
          description: "PDF report created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to create PDF report",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPdf(false);
    }
  };

  const handleGenerateStrategy = async () => {
    const hasSearchData = report && (
      (report.monthly_analysis?.searchTerms?.length > 0) ||
      (report.quarterly_analysis?.searchTerms?.length > 0) ||
      (report.ytd_analysis?.searchTerms?.length > 0)
    );

    if (!hasSearchData) {
      toast({
        title: "No Search Console Data",
        description: "Please run a complete analysis with Search Console data first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingStrategy(true);
    try {
      // Save the report to localStorage before navigating
      localStorage.setItem('analysisReport', JSON.stringify(report));

      // Prepare the analysis input
      const analysisInput = {
        ga4Data: {
          monthly: report.monthly_analysis,
          quarterly: report.quarterly_analysis,
          yoy: report.ytd_analysis
        },
        gscData: {
          searchTerms: report.weekly_analysis?.searchTerms || [],
          pages: report.weekly_analysis?.pages || [],
          monthlySearchTerms: report.monthly_analysis?.searchTerms || [],
          monthlyPages: report.monthly_analysis?.pages || [],
          quarterlySearchTerms: report.quarterly_analysis?.searchTerms || [],
          quarterlyPages: report.quarterly_analysis?.pages || [],
        }
      };

      // Generate strategy
      const response = await supabase.functions.invoke('generate-seo-strategy', {
        body: analysisInput
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to generate strategy');
      }

      // Store the generated strategy in localStorage
      localStorage.setItem('generatedStrategy', JSON.stringify(response.data));

      // Navigate to strategy page
      navigate("/seo-strategy");
      
      toast({
        title: "Success",
        description: "SEO Strategy generated successfully.",
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate SEO strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full text-left">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) return null;

  const formatDateRange = (period: string) => {
    if (!period) return "";
    const dates = period.match(/\d{4}-\d{2}-\d{2}/g);
    if (!dates || dates.length !== 2) return period;
    
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[1]);
    
    return `${format(startDate, 'MMM d, yyyy')} to ${format(endDate, 'MMM d, yyyy')}`;
  };

  const getAnalysisTitle = (type: string, period: string) => {
    const formattedRange = formatDateRange(period);
    const previousRange = period?.match(/vs\s*(.*)/)?.[1];
    const formattedPreviousRange = previousRange ? formatDateRange(previousRange) : "";
    
    return {
      title: type,
      dateRange: formattedRange && formattedPreviousRange 
        ? `${formattedRange} vs ${formattedPreviousRange}`
        : formattedRange
    };
  };

  const analyses = [
    { type: "Week over Week", data: report.weekly_analysis },
    { type: "Month over Month", data: report.monthly_analysis },
    { type: "Quarter over Quarter", data: report.quarterly_analysis },
    { type: "Year to Date", data: report.ytd_analysis },
    { type: "Last 28 Days Year over Year", data: report.last28_yoy_analysis },
  ].filter(analysis => analysis.data && analysis.data.current);

  if (analyses.length === 0) return null;

  return (
    <div className="w-full space-y-6 text-left">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <div className="flex gap-2">
          {channelName === 'Organic Search' && (
            <Button
              onClick={handleGenerateStrategy}
              disabled={isGeneratingStrategy}
              variant="secondary"
            >
              {isGeneratingStrategy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate SEO Strategy
            </Button>
          )}
          <ExportButtons
            onExportDoc={handleCreateDoc}
            onExportPdf={handleCreatePdf}
            isCreatingDoc={isCreatingDoc}
            isCreatingPdf={isCreatingPdf}
            isGeneratingInsights={isGeneratingInsights}
          />
        </div>
      </div>
      <div className="px-4 sm:px-6 lg:px-8">
        <AnalysisInsights 
          insights={insights} 
          isLoading={isGeneratingInsights}
          channel={channelName} 
        />
      </div>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8">
        {analyses.map((analysis) => {
          if (!analysis.data?.current) return null;
          
          const { title, dateRange } = getAnalysisTitle(analysis.type, analysis.data.period);
          
          return (
            <AnalysisCard
              key={title}
              title={title}
              dateRange={dateRange}
              data={analysis.data}
              channelName={channelName}
            />
          );
        })}
      </div>
    </div>
  );
}