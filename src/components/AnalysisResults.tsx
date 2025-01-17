import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AnalysisResultsProps {
  report: {
    weekly_analysis: any;
    monthly_analysis: any;
    quarterly_analysis: any;
    yoy_analysis: any;
  } | null;
  isLoading: boolean;
}

export function AnalysisResults({ report, isLoading }: AnalysisResultsProps) {
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
    { title: "Quarterly Analysis", data: report.quarterly_analysis },
    { title: "Year over Year", data: report.yoy_analysis },
  ].filter(analysis => analysis.data && analysis.data.current);

  if (analyses.length === 0) return null;

  return (
    <div className="space-y-6">
      {analyses.map((analysis) => {
        if (!analysis.data?.current) return null;
        
        return (
          <Card key={analysis.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{analysis.title}</CardTitle>
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}