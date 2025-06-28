import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { MetricCard } from "./MetricCard";
import { SearchTermsTable } from "./SearchTermsTable";
import { TopPagesTable } from "./TopPagesTable";
import { TrendingUp, TrendingDown, Eye, MousePointer, Users, Clock } from "lucide-react";

interface DashboardTabsProps {
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
  activeTab?: string;
}

export function DashboardTabs({ analyses, activeTab = "overview" }: DashboardTabsProps) {
  if (!analyses.length) return null;

  // Get the most recent analysis for overview (usually the first one which should be weekly)
  const primaryAnalysis = analyses[0];

  // Prepare chart data from the analyses - use real data from all time periods
  const getChartData = () => {
    return analyses.map((analysis) => ({
      name: analysis.type.replace(' over ', '/').replace(' to ', '/'),
      sessions: analysis.data.current?.sessions || 0,
      users: analysis.data.current?.users || 0,
      pageviews: analysis.data.current?.pageviews || 0,
      clicks: analysis.data.current?.clicks || 0,
      impressions: analysis.data.current?.impressions || 0,
      ctr: analysis.data.current?.ctr ? (analysis.data.current.ctr * 100) : 0,
      position: analysis.data.current?.position || 0,
      bounceRate: analysis.data.current?.bounceRate ? (analysis.data.current.bounceRate * 100) : 0,
      change: analysis.data.growth_rate || 0,
    }));
  };

  const chartData = getChartData();

  // Color scheme for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${Math.round(seconds)}s`;
  };

  if (activeTab === "overview") {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Google Analytics Metrics */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                  <p className="text-2xl font-bold">{formatNumber(primaryAnalysis.data.current?.sessions || 0)}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.sessions || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.sessions || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.sessions || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Users</p>
                  <p className="text-2xl font-bold">{formatNumber(primaryAnalysis.data.current?.users || 0)}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.users || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.users || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.users || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Search Console Metrics */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clicks</p>
                  <p className="text-2xl font-bold">{formatNumber(primaryAnalysis.data.current?.clicks || 0)}</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.clicks || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.clicks || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.clicks || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Impressions</p>
                  <p className="text-2xl font-bold">{formatNumber(primaryAnalysis.data.current?.impressions || 0)}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-500" />
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.impressions || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.impressions || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.impressions || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics Traffic Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Line type="monotone" dataKey="sessions" stroke="#0088FE" strokeWidth={2} name="Sessions" />
                  <Line type="monotone" dataKey="users" stroke="#00C49F" strokeWidth={2} name="Users" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Console Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Bar dataKey="clicks" fill="#0088FE" name="Clicks" />
                  <Bar dataKey="impressions" fill="#00C49F" name="Impressions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional metrics grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Click-Through Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {primaryAnalysis.data.current?.ctr ? (primaryAnalysis.data.current.ctr * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.ctr || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.ctr || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.ctr || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {primaryAnalysis.data.current?.position?.toFixed(1) || '0.0'}
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.position || 0) <= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.position || 0) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.position || 0).toFixed(1)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {primaryAnalysis.data.current?.bounceRate ? (primaryAnalysis.data.current.bounceRate * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="flex items-center mt-2">
                {(primaryAnalysis.data.changes?.bounceRate || 0) <= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${(primaryAnalysis.data.changes?.bounceRate || 0) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(primaryAnalysis.data.changes?.bounceRate || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === "performance") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyses.map((analysis, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{analysis.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{analysis.dateRange}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Google Analytics Metrics */}
                  <MetricCard
                    title="Sessions"
                    value={analysis.data.current?.sessions || 0}
                    change={analysis.data.changes?.sessions || 0}
                  />
                  <MetricCard
                    title="Users"
                    value={analysis.data.current?.users || 0}
                    change={analysis.data.changes?.users || 0}
                  />
                  <MetricCard
                    title="Pageviews"
                    value={analysis.data.current?.pageviews || 0}
                    change={analysis.data.changes?.pageviews || 0}
                  />
                  <MetricCard
                    title="Bounce Rate"
                    value={`${((analysis.data.current?.bounceRate || 0) * 100).toFixed(1)}%`}
                    change={analysis.data.changes?.bounceRate || 0}
                  />
                  {/* Search Console Metrics */}
                  <MetricCard
                    title="Clicks"
                    value={Math.round(analysis.data.current?.clicks || 0)}
                    change={analysis.data.changes?.clicks || 0}
                  />
                  <MetricCard
                    title="Impressions"
                    value={Math.round(analysis.data.current?.impressions || 0)}
                    change={analysis.data.changes?.impressions || 0}
                  />
                  <MetricCard
                    title="CTR"
                    value={`${((analysis.data.current?.ctr || 0) * 100).toFixed(1)}%`}
                    change={analysis.data.changes?.ctr || 0}
                  />
                  <MetricCard
                    title="Avg Position"
                    value={analysis.data.current?.position?.toFixed(1) || '0.0'}
                    change={analysis.data.changes?.position || 0}
                    higherIsBetter={false}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance comparison chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison Across Time Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
                <Bar dataKey="sessions" fill="#0088FE" name="Sessions" />
                <Bar dataKey="clicks" fill="#00C49F" name="Clicks" />
                <Bar dataKey="impressions" fill="#FFBB28" name="Impressions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeTab === "search") {
    return (
      <div className="space-y-6">
        {analyses.map((analysis, index) => (
          analysis.data.searchTerms && analysis.data.searchTerms.length > 0 && (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{analysis.title} - Search Terms</CardTitle>
                <p className="text-sm text-muted-foreground">{analysis.dateRange}</p>
              </CardHeader>
              <CardContent>
                <SearchTermsTable searchTerms={analysis.data.searchTerms} />
              </CardContent>
            </Card>
          )
        ))}
      </div>
    );
  }

  if (activeTab === "pages") {
    return (
      <div className="space-y-6">
        {analyses.map((analysis, index) => (
          analysis.data.pages && analysis.data.pages.length > 0 && (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{analysis.title} - Top Pages</CardTitle>
                <p className="text-sm text-muted-foreground">{analysis.dateRange}</p>
              </CardHeader>
              <CardContent>
                <TopPagesTable pages={analysis.data.pages} />
              </CardContent>
            </Card>
          )
        ))}
      </div>
    );
  }

  return null;
}
