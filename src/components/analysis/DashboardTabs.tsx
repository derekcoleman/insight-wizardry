
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
}

export function DashboardTabs({ analyses }: DashboardTabsProps) {
  if (!analyses.length) return null;

  // Get the most recent analysis for overview (usually the first one which should be weekly)
  const primaryAnalysis = analyses[0];

  // Prepare chart data from the analyses - use real data
  const getChartData = () => {
    return analyses.map((analysis, index) => ({
      name: analysis.type.replace(' over ', '/').replace(' to ', '/'),
      sessions: analysis.data.current?.sessions || 0,
      users: analysis.data.current?.users || 0,
      pageviews: analysis.data.current?.pageviews || 0,
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

  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="search">Search Terms</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pageviews</p>
                    <p className="text-2xl font-bold">{formatNumber(primaryAnalysis.data.current?.pageviews || 0)}</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-purple-500" />
                </div>
                <div className="flex items-center mt-2">
                  {(primaryAnalysis.data.changes?.pageviews || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${(primaryAnalysis.data.changes?.pageviews || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(primaryAnalysis.data.changes?.pageviews || 0).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Duration</p>
                    <p className="text-2xl font-bold">{formatDuration(primaryAnalysis.data.current?.averageSessionDuration || 0)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="flex items-center mt-2">
                  {(primaryAnalysis.data.changes?.averageSessionDuration || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm ${(primaryAnalysis.data.changes?.averageSessionDuration || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(primaryAnalysis.data.changes?.averageSessionDuration || 0).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Trends</CardTitle>
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
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                    <Bar dataKey="sessions" fill="#0088FE" name="Sessions" />
                    <Bar dataKey="pageviews" fill="#00C49F" name="Pageviews" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analyses.map((analysis, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{analysis.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{analysis.dateRange}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
