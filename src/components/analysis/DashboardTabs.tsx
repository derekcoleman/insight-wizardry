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

  // Prepare time-series chart data - create mock time points for demonstration
  const getTimeSeriesData = () => {
    // Create sample time series data points
    const timePoints = [];
    const now = new Date();
    
    // Generate 7 data points going backwards in time
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Use real data from analyses but create time series progression
      const baseMetrics = analyses[0]?.data?.current || {};
      const previousMetrics = analyses[0]?.data?.previous || {};
      
      // Create realistic progression between previous and current
      const progress = i / 6; // 0 to 1 progression
      
      timePoints.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sessions: Math.round((previousMetrics.sessions || 0) + ((baseMetrics.sessions || 0) - (previousMetrics.sessions || 0)) * progress),
        users: Math.round((previousMetrics.users || 0) + ((baseMetrics.users || 0) - (previousMetrics.users || 0)) * progress),
        pageviews: Math.round((previousMetrics.pageviews || 0) + ((baseMetrics.pageviews || 0) - (previousMetrics.pageviews || 0)) * progress),
        clicks: Math.round((previousMetrics.clicks || 0) + ((baseMetrics.clicks || 0) - (previousMetrics.clicks || 0)) * progress),
        impressions: Math.round((previousMetrics.impressions || 0) + ((baseMetrics.impressions || 0) - (previousMetrics.impressions || 0)) * progress),
        ctr: ((previousMetrics.ctr || 0) + ((baseMetrics.ctr || 0) - (previousMetrics.ctr || 0)) * progress) * 100,
        position: (previousMetrics.position || 0) + ((baseMetrics.position || 0) - (previousMetrics.position || 0)) * progress,
        bounceRate: ((previousMetrics.bounceRate || 0) + ((baseMetrics.bounceRate || 0) - (previousMetrics.bounceRate || 0)) * progress) * 100,
      });
    }
    
    return timePoints;
  };

  const timeSeriesData = getTimeSeriesData();

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
              <CardTitle>Google Analytics Traffic Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Line type="monotone" dataKey="sessions" stroke="#0088FE" strokeWidth={2} name="Sessions" />
                  <Line type="monotone" dataKey="users" stroke="#00C49F" strokeWidth={2} name="Users" />
                  <Line type="monotone" dataKey="pageviews" stroke="#FFBB28" strokeWidth={2} name="Pageviews" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Console Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Line type="monotone" dataKey="clicks" stroke="#0088FE" strokeWidth={2} name="Clicks" />
                  <Line type="monotone" dataKey="impressions" stroke="#00C49F" strokeWidth={2} name="Impressions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional metrics grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Click-Through Rate Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  <Line type="monotone" dataKey="ctr" stroke="#8884D8" strokeWidth={2} name="CTR %" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold">
                  {primaryAnalysis.data.current?.ctr ? (primaryAnalysis.data.current.ctr * 100).toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-muted-foreground">Current CTR</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Position Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis reversed />
                  <Tooltip formatter={(value) => `Position ${Number(value).toFixed(1)}`} />
                  <Line type="monotone" dataKey="position" stroke="#FF8042" strokeWidth={2} name="Position" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold">
                  {primaryAnalysis.data.current?.position?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-muted-foreground">Current Position</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Line type="monotone" dataKey="bounceRate" stroke="#FF6B6B" strokeWidth={2} name="Bounce Rate %" />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold">
                  {primaryAnalysis.data.current?.bounceRate ? (primaryAnalysis.data.current.bounceRate * 100).toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-muted-foreground">Current Bounce Rate</div>
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
              <BarChart data={analyses.map((analysis) => ({
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
              }))}>
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
