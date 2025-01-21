import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisInsights } from "./AnalysisInsights";
import { AnalysisCard } from "./analysis/AnalysisCard";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "./ui/use-toast";

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
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const generateInsights = async () => {
      if (!report || isLoading) return;
      
      setIsGeneratingInsights(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-insights', {
          body: { data: report }
        });

        if (error) throw error;
        setInsights(data.insights);
      } catch (error) {
        console.error('Error generating insights:', error);
      } finally {
        setIsGeneratingInsights(false);
      }
    };

    generateInsights();
  }, [report, isLoading]);

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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analysis Results</h2>
        <Button
          onClick={handleCreateDoc}
          disabled={isCreatingDoc || isGeneratingInsights}
          variant="outline"
        >
          {isCreatingDoc ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          Export to Google Doc
        </Button>
      </div>
      <AnalysisInsights insights={insights} isLoading={isGeneratingInsights} />
      {analyses.map((analysis) => {
        if (!analysis.data?.current) return null;
        
        const { title, dateRange } = getAnalysisTitle(analysis.type, analysis.data.period);
        
        return (
          <AnalysisCard
            key={title}
            title={title}
            dateRange={dateRange}
            data={analysis.data}
          />
        );
      })}
    </div>
  );
}