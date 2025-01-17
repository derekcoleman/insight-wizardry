import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnalysisInsights } from "./AnalysisInsights";
import { supabase } from "@/integrations/supabase/client";

interface SearchTerm {
  term: string;
  current: {
    clicks: number;
    impressions: number;
    ctr: string;
    position: string;
  };
  previous: {
    clicks: number;
    impressions: number;
    ctr: string;
    position: string;
  };
  changes: {
    clicks: string;
    impressions: string;
    ctr: string;
    position: string;
  };
}

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

  if (isLoading) {
    return (
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
    );
  }

  if (!report) return null;

  const analyses = [
    { title: "Week over Week", data: report.weekly_analysis },
    { title: "Month over Month", data: report.monthly_analysis },
    { title: "Quarter over Quarter", data: report.quarterly_analysis },
    { title: "Year to Date", data: report.ytd_analysis },
    { title: "Last 28 Days Year over Year", data: report.last28_yoy_analysis },
  ].filter(analysis => analysis.data && analysis.data.current);

  if (analyses.length === 0) return null;

  const renderSearchTermsTable = (searchTerms: SearchTerm[]) => {
    if (!searchTerms || searchTerms.length === 0) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Top Search Terms</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Search Term</TableHead>
              <TableHead className="text-right">Current Clicks</TableHead>
              <TableHead className="text-right">Previous Clicks</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchTerms.map((term) => (
              <TableRow key={term.term}>
                <TableCell className="font-medium">{term.term}</TableCell>
                <TableCell className="text-right">{term.current.clicks}</TableCell>
                <TableCell className="text-right">{term.previous.clicks}</TableCell>
                <TableCell className={`text-right ${Number(term.changes.clicks) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(term.changes.clicks) >= 0 ? '↑' : '↓'} {Math.abs(Number(term.changes.clicks))}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <AnalysisInsights insights={insights} isLoading={isGeneratingInsights} />
      {analyses.map((analysis) => {
        if (!analysis.data?.current) return null;
        
        return (
          <Card key={analysis.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{analysis.title}</CardTitle>
                  {analysis.data.period && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {analysis.data.period}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {analysis.data.dataSources?.ga4 && (
                    <Badge variant="secondary">GA4</Badge>
                  )}
                  {analysis.data.dataSources?.gsc && (
                    <Badge variant="secondary">Search Console</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Organic Sessions</p>
                    <p className="text-2xl font-bold">
                      {analysis.data.current.sessions?.toLocaleString() ?? '0'}
                    </p>
                    <p className={`text-sm ${analysis.data.changes?.sessions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.data.changes?.sessions >= 0 ? '↑' : '↓'} {Math.abs(analysis.data.changes?.sessions ?? 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Organic {analysis.data.current.conversionGoal || 'Conversions'}
                    </p>
                    <p className="text-2xl font-bold">
                      {analysis.data.current.conversions?.toLocaleString() ?? '0'}
                    </p>
                    <p className={`text-sm ${analysis.data.changes?.conversions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.data.changes?.conversions >= 0 ? '↑' : '↓'} {Math.abs(analysis.data.changes?.conversions ?? 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Organic Revenue</p>
                    <p className="text-2xl font-bold">
                      ${analysis.data.current.revenue?.toLocaleString() ?? '0'}
                    </p>
                    <p className={`text-sm ${analysis.data.changes?.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.data.changes?.revenue >= 0 ? '↑' : '↓'} {Math.abs(analysis.data.changes?.revenue ?? 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
                {analysis.data.summary && (
                  <div className="text-sm text-muted-foreground mt-4 whitespace-pre-line">
                    {analysis.data.summary}
                  </div>
                )}
                {analysis.data.searchTerms && renderSearchTermsTable(analysis.data.searchTerms)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}