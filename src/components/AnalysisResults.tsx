import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
        
        const current = analysis.data.current;
        const changes = analysis.data.changes;
        
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Traffic & Engagement</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Organic Sessions</p>
                      <p className="text-2xl font-bold">
                        {current.sessions?.toLocaleString() ?? '0'}
                      </p>
                      <p className={`text-sm ${changes?.sessions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.sessions >= 0 ? '↑' : '↓'} {Math.abs(changes?.sessions ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Engagement Rate</p>
                      <p className="text-2xl font-bold">
                        {((current.engagedSessions / current.sessions) * 100).toFixed(1)}%
                      </p>
                      <p className={`text-sm ${changes?.engagedSessions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.engagedSessions >= 0 ? '↑' : '↓'} {Math.abs(changes?.engagedSessions ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">New Users</p>
                      <p className="text-2xl font-bold">
                        {current.newUsers?.toLocaleString() ?? '0'}
                      </p>
                      <p className={`text-sm ${changes?.newUsers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.newUsers >= 0 ? '↑' : '↓'} {Math.abs(changes?.newUsers ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Bounce Rate</p>
                      <p className="text-2xl font-bold">
                        {current.bounceRate?.toFixed(1)}%
                      </p>
                      <p className={`text-sm ${changes?.bounceRate <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.bounceRate >= 0 ? '↑' : '↓'} {Math.abs(changes?.bounceRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conversion Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Conversions & Revenue</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Conversions</p>
                      <p className="text-2xl font-bold">
                        {current.conversions?.toLocaleString() ?? '0'}
                      </p>
                      <p className={`text-sm ${changes?.conversions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.conversions >= 0 ? '↑' : '↓'} {Math.abs(changes?.conversions ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Conversion Rate</p>
                      <p className="text-2xl font-bold">
                        {current.conversionRate?.toFixed(2)}%
                      </p>
                      <p className={`text-sm ${changes?.conversionRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.conversionRate >= 0 ? '↑' : '↓'} {Math.abs(changes?.conversionRate ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Revenue</p>
                      <p className="text-2xl font-bold">
                        ${current.revenue?.toLocaleString() ?? '0'}
                      </p>
                      <p className={`text-sm ${changes?.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.revenue >= 0 ? '↑' : '↓'} {Math.abs(changes?.revenue ?? 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Avg Order Value</p>
                      <p className="text-2xl font-bold">
                        ${current.averageOrderValue?.toLocaleString() ?? '0'}
                      </p>
                      <p className={`text-sm ${changes?.averageOrderValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {changes?.averageOrderValue >= 0 ? '↑' : '↓'} {Math.abs(changes?.averageOrderValue ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search Console Metrics */}
                {current.clicks !== undefined && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Search Performance</h3>
                    <div className="grid gri d-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Clicks</p>
                        <p className="text-2xl font-bold">
                          {current.clicks?.toLocaleString() ?? '0'}
                        </p>
                        <p className={`text-sm ${changes?.clicks >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {changes?.clicks >= 0 ? '↑' : '↓'} {Math.abs(changes?.clicks ?? 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Impressions</p>
                        <p className="text-2xl font-bold">
                          {current.impressions?.toLocaleString() ?? '0'}
                        </p>
                        <p className={`text-sm ${changes?.impressions >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {changes?.impressions >= 0 ? '↑' : '↓'} {Math.abs(changes?.impressions ?? 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">CTR</p>
                        <p className="text-2xl font-bold">
                          {(current.ctr * 100)?.toFixed(1)}%
                        </p>
                        <p className={`text-sm ${changes?.ctr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {changes?.ctr >= 0 ? '↑' : '↓'} {Math.abs(changes?.ctr ?? 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Avg Position</p>
                        <p className="text-2xl font-bold">
                          {current.position?.toFixed(1) ?? '0'}
                        </p>
                        <p className={`text-sm ${changes?.position <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {changes?.position >= 0 ? '↓' : '↑'} {Math.abs(changes?.position ?? 0).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Top Queries Table */}
                    {current.topQueries?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-4">Top Performing Keywords</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Keyword</TableHead>
                              <TableHead className="text-right">Clicks</TableHead>
                              <TableHead className="text-right">Impressions</TableHead>
                              <TableHead className="text-right">CTR</TableHead>
                              <TableHead className="text-right">Position</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {current.topQueries.slice(0, 5).map((query: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{query.query}</TableCell>
                                <TableCell className="text-right">{query.clicks}</TableCell>
                                <TableCell className="text-right">{query.impressions}</TableCell>
                                <TableCell className="text-right">{(query.ctr * 100).toFixed(1)}%</TableCell>
                                <TableCell className="text-right">{query.position.toFixed(1)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}

                {/* Detailed Summary */}
                {analysis.data.summary && (
                  <div className="text-sm text-muted-foreground mt-6 whitespace-pre-line">
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