import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisInsights } from "./AnalysisInsights";
import { DashboardTabs } from "./analysis/DashboardTabs";
import { ExecutiveSummary } from "./analysis/ExecutiveSummary";
import { ConversionFunnel } from "./analysis/ConversionFunnel";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "./ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, FileType2, Globe, AlertCircle, CheckCircle } from "lucide-react";
import { useSavedAudits } from "@/hooks/useSavedAudits";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalysisResultsProps {
  report: {
    weekly_analysis: any;
    monthly_analysis: any;
    quarterly_analysis: any;
    ytd_analysis: any;
    last28_yoy_analysis: any;
  } | null;
  isLoading: boolean;
}

export function AnalysisResults({ report, isLoading }: AnalysisResultsProps) {
  const [insights, setInsights] = useState<string>("");
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [isCrawlingSitemap, setIsCrawlingSitemap] = useState(false);
  const [sitemapStatus, setSitemapStatus] = useState<string>("");
  const [sitemapError, setSitemapError] = useState<string | null>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { saveAudit } = useSavedAudits();
  const { projects, saveStrategyToProject } = useProjects();
  const { user } = useAuth();

  useEffect(() => {
    const generateInsights = async () => {
      if (!report || isLoading) return;
      
      setIsGeneratingInsights(true);
      setIsCrawlingSitemap(true);
      setSitemapStatus("Crawling XML sitemap...");
      setSitemapError(null);
      
      try {
        // Show crawling status
        toast({
          title: "Analyzing Content",
          description: "Crawling XML sitemap and analyzing page freshness...",
        });

        const { data, error } = await supabase.functions.invoke('generate-insights', {
          body: { data: report }
        });

        if (error) throw error;
        
        // Check if insights contain sitemap information
        if (data.insights && data.insights.includes('SITEMAP LIMITATION')) {
          setSitemapError("Sitemap crawling encountered issues - analysis based on performance data only");
          setSitemapStatus("Sitemap crawling failed");
        } else if (data.insights && data.insights.includes('NO SITEMAP DATA')) {
          setSitemapError("No XML sitemap found - consider creating one for better analysis");
          setSitemapStatus("No sitemap found");
        } else {
          setSitemapStatus("Sitemap crawled successfully");
        }
        
        setInsights(data.insights);
        
        toast({
          title: "Analysis Complete",
          description: sitemapError 
            ? "Analysis completed with limited sitemap data" 
            : "LLM optimization recommendations generated successfully",
        });
      } catch (error) {
        console.error('Error generating insights:', error);
        setSitemapError("Analysis failed - please try again");
        setSitemapStatus("Analysis failed");
        toast({
          title: "Analysis Error",
          description: "Failed to generate insights. Some recommendations may be limited.",
          variant: "destructive",
        });
      } finally {
        setIsGeneratingInsights(false);
        setIsCrawlingSitemap(false);
      }
    };

    generateInsights();
  }, [report, isLoading, toast]);

  useEffect(() => {
    const autoSaveAudit = async () => {
      if (!report || !user || hasAutoSaved || isLoading) return;

      try {
        const auditTitle = `Analysis - ${format(new Date(), 'MMM d, yyyy HH:mm')}`;
        const websiteUrl = report.weekly_analysis?.pages?.[0]?.page || 
                          report.monthly_analysis?.pages?.[0]?.page || 
                          'Unknown';

        await saveAudit({
          title: auditTitle,
          description: 'Automated audit save after analysis completion',
          audit_data: report,
          audit_type: 'comprehensive',
          website_url: websiteUrl
        });

        setHasAutoSaved(true);
      } catch (error) {
        console.error('Error auto-saving audit:', error);
      }
    };

    autoSaveAudit();
  }, [report, user, hasAutoSaved, isLoading, saveAudit]);

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

      // Find the current project based on the analysis data
      const websiteUrl = report.weekly_analysis?.pages?.[0]?.page || 
                        report.monthly_analysis?.pages?.[0]?.page;
      
      if (websiteUrl && projects.length > 0) {
        const urlObj = new URL(websiteUrl);
        const currentProject = projects.find(p => p.url && p.url.includes(urlObj.hostname));
        
        if (currentProject) {
          await saveStrategyToProject(currentProject.id, response.data);
        }
      }

      // Store the generated strategy in localStorage
      localStorage.setItem('generatedStrategy', JSON.stringify(response.data));

      // Navigate to strategy page
      navigate("/seo-strategy");
      
      toast({
        title: "Success",
        description: "SEO Strategy generated and saved successfully.",
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
  ].filter(analysis => analysis.data && analysis.data.current).map(analysis => {
    const { title, dateRange } = getAnalysisTitle(analysis.type, analysis.data.period);
    return {
      type: analysis.type,
      data: analysis.data,
      title,
      dateRange
    };
  });

  if (analyses.length === 0) return null;

  return (
    <div className="w-full space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateStrategy}
            disabled={isGeneratingStrategy}
            variant="secondary"
          >
            {isGeneratingStrategy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate SEO Strategy
          </Button>
          <Button
            onClick={handleCreateDoc}
            disabled={isCreatingDoc || isGeneratingInsights}
            variant="outline"
            size="icon"
            title="Export to Google Doc"
          >
            {isCreatingDoc ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={handleCreatePdf}
            disabled={isCreatingPdf || isGeneratingInsights}
            variant="outline"
            size="icon"
            title="Export to PDF"
          >
            {isCreatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileType2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {(isCrawlingSitemap || sitemapStatus) && (
        <Card className={`${sitemapError ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {isCrawlingSitemap ? (
                <Globe className="h-5 w-5 text-blue-600 animate-spin" />
              ) : sitemapError ? (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              <div>
                <p className={`text-sm font-medium ${sitemapError ? 'text-amber-900' : 'text-blue-900'}`}>
                  {sitemapStatus || "Analyzing Website Structure"}
                </p>
                {sitemapError ? (
                  <p className="text-xs text-amber-700 mt-1">{sitemapError}</p>
                ) : (
                  <p className="text-xs text-blue-700 mt-1">
                    {isCrawlingSitemap ? "Extracting last-modified dates for content freshness analysis..." : "Content freshness data integrated into recommendations"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="ai-analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="search">Search Terms</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-analysis" className="space-y-6">
          <ExecutiveSummary analyses={analyses} />
          <ConversionFunnel analyses={analyses} />
          <AnalysisInsights insights={insights} isLoading={isGeneratingInsights} />
        </TabsContent>

        <TabsContent value="overview">
          <DashboardTabs analyses={analyses} activeTab="overview" />
        </TabsContent>

        <TabsContent value="performance">
          <DashboardTabs analyses={analyses} activeTab="performance" />
        </TabsContent>

        <TabsContent value="search">
          <DashboardTabs analyses={analyses} activeTab="search" />
        </TabsContent>

        <TabsContent value="pages">
          <DashboardTabs analyses={analyses} activeTab="pages" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
