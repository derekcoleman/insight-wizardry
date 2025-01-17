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
    { title: "Quarter over Quarter", data: report.quarterly_analysis },
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
              <div className="space-y-6">
                {/* GA4 Metrics */}
                {analysis.data.current.sessions !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Traffic & Engagement Metrics (GA4)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard
                        label="Organic Sessions"
                        current={analysis.data.current.sessions}
                        change={analysis.data.changes?.sessions}
                      />
                      <MetricCard
                        label="Conversion Rate"
                        current={analysis.data.current.conversionRate}
                        change={analysis.data.changes?.conversionRate}
                        format="percent"
                      />
                      <MetricCard
                        label="New Users"
                        current={analysis.data.current.newUsers}
                        change={analysis.data.changes?.newUsers}
                      />
                      <MetricCard
                        label="Bounce Rate"
                        current={analysis.data.current.bounceRate}
                        change={analysis.data.changes?.bounceRate}
                        format="percent"
                        invertChange
                      />
                    </div>
                  </div>
                )}

                {/* Conversion Metrics */}
                {analysis.data.current.conversions !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Conversion Metrics (GA4)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <MetricCard
                        label="Conversions"
                        current={analysis.data.current.conversions}
                        change={analysis.data.changes?.conversions}
                      />
                      <MetricCard
                        label="Revenue"
                        current={analysis.data.current.revenue}
                        change={analysis.data.changes?.revenue}
                        format="currency"
                      />
                      <MetricCard
                        label="Avg Order Value"
                        current={analysis.data.current.averageOrderValue}
                        change={analysis.data.changes?.averageOrderValue}
                        format="currency"
                      />
                    </div>
                  </div>
                )}

                {/* Search Console Metrics */}
                {analysis.data.current.clicks !== undefined && (
                  <div>
                    <h4 className="text-sm font-medium mb-4">Search Console Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard
                        label="Clicks"
                        current={analysis.data.current.clicks}
                        change={analysis.data.changes?.clicks}
                      />
                      <MetricCard
                        label="Impressions"
                        current={analysis.data.current.impressions}
                        change={analysis.data.changes?.impressions}
                      />
                      <MetricCard
                        label="CTR"
                        current={analysis.data.current.ctr * 100}
                        change={analysis.data.changes?.ctr}
                        format="percent"
                      />
                      <MetricCard
                        label="Avg Position"
                        current={analysis.data.current.position}
                        change={analysis.data.changes?.position}
                        format="decimal"
                        invertChange
                      />
                    </div>

                    {analysis.data.current.topQueries && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-4">Top Performing Keywords</h4>
                        <div className="space-y-2">
                          {analysis.data.current.topQueries.slice(0, 5).map((query: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <span className="font-medium">{query.query}</span>
                              <div className="flex gap-4 text-sm">
                                <span>{query.clicks} clicks</span>
                                <span>{query.impressions} impressions</span>
                                <span>Pos: {query.position.toFixed(1)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {analysis.data.summary && (
                  <div className="mt-6 text-sm text-muted-foreground whitespace-pre-line">
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

interface MetricCardProps {
  label: string;
  current: number;
  change?: number;
  format?: 'number' | 'currency' | 'percent' | 'decimal';
  invertChange?: boolean;
}

function MetricCard({ label, current, change, format = 'number', invertChange = false }: MetricCardProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'decimal':
        return value.toFixed(1);
      default:
        return value.toLocaleString();
    }
  };

  const getChangeColor = (changeValue: number) => {
    if (invertChange) {
      return changeValue < 0 ? 'text-green-600' : 'text-red-600';
    }
    return changeValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{formatValue(current)}</p>
      {change !== undefined && (
        <p className={`text-sm ${getChangeColor(change)}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </p>
      )}
    </div>
  );
}