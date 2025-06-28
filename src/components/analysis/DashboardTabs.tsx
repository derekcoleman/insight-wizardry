
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { MetricCard } from "./MetricCard";
import { SearchTermsTable } from "./SearchTermsTable";
import { TopPagesTable } from "./TopPagesTable";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { ConversionFunnel } from "./ConversionFunnel";
import { PerformanceTrends } from "./PerformanceTrends";
import { TrendingUp, TrendingDown, Eye, MousePointer, Users } from "lucide-react";

interface DashboardTabsProps {
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
  activeTab?: string;
}

export function DashboardTabs({ analyses, activeTab = "ai-analysis" }: DashboardTabsProps) {
  if (!analyses.length) return null;

  const primaryAnalysis = analyses[0];
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (activeTab === "ai-analysis") {
    return <ExecutiveSummary analyses={analyses} />;
  }

  if (activeTab === "overview") {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organic Sessions</p>
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
                  {Math.abs(primaryAnalysis.data.changes?.sessions || 0).toFixed(1)}% vs prev period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
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
                  {Math.abs(primaryAnalysis.data.changes?.users || 0).toFixed(1)}% vs prev period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Search Clicks</p>
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
                  {Math.abs(primaryAnalysis.data.changes?.clicks || 0).toFixed(1)}% vs prev period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Search Visibility</p>
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
                  {Math.abs(primaryAnalysis.data.changes?.impressions || 0).toFixed(1)}% vs prev period
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <ConversionFunnel 
          data={{
            impressions: primaryAnalysis.data.current?.impressions || 0,
            clicks: primaryAnalysis.data.current?.clicks || 0,
            sessions: primaryAnalysis.data.current?.sessions || 0,
            conversions: primaryAnalysis.data.current?.conversions || 0
          }}
        />

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Click-Through Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {primaryAnalysis.data.current?.ctr ? (primaryAnalysis.data.current.ctr * 100).toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Industry benchmark: 2.1%
                </div>
                <div className="flex items-center justify-center gap-1">
                  {(primaryAnalysis.data.changes?.ctr || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${(primaryAnalysis.data.changes?.ctr || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(primaryAnalysis.data.changes?.ctr || 0).toFixed(1)}% change
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Search Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {primaryAnalysis.data.current?.position?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Target: Top 5 positions
                </div>
                <div className="flex items-center justify-center gap-1">
                  {(primaryAnalysis.data.changes?.position || 0) <= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${(primaryAnalysis.data.changes?.position || 0) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(primaryAnalysis.data.changes?.position || 0).toFixed(1)} positions
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {primaryAnalysis.data.current?.bounceRate ? (primaryAnalysis.data.current.bounceRate * 100).toFixed(1) : '0.0'}%
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  Industry benchmark: 58%
                </div>
                <div className="flex items-center justify-center gap-1">
                  {(primaryAnalysis.data.changes?.bounceRate || 0) <= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${(primaryAnalysis.data.changes?.bounceRate || 0) <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(primaryAnalysis.data.changes?.bounceRate || 0).toFixed(1)}% change
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === "performance") {
    return <PerformanceTrends analyses={analyses} />;
  }

  if (activeTab === "search") {
    return (
      <div className="space-y-6">
        {analyses.map((analysis, index) => (
          analysis.data.searchTerms && analysis.data.searchTerms.length > 0 && (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{analysis.title} - Search Terms Performance</CardTitle>
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
                <CardTitle>{analysis.title} - Top Performing Pages</CardTitle>
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
