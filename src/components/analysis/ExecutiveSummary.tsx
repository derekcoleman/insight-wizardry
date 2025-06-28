
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";

interface ExecutiveSummaryProps {
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
}

export function ExecutiveSummary({ analyses }: ExecutiveSummaryProps) {
  if (!analyses.length) return null;

  const primaryAnalysis = analyses[0];
  const data = primaryAnalysis.data;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Calculate key metrics
  const sessions = data.current?.sessions || 0;
  const users = data.current?.users || 0;
  const clicks = data.current?.clicks || 0;
  const impressions = data.current?.impressions || 0;
  const ctr = data.current?.ctr || 0;
  const position = data.current?.position || 0;
  const bounceRate = data.current?.bounceRate || 0;

  const sessionChange = data.changes?.sessions || 0;
  const userChange = data.changes?.users || 0;
  const clickChange = data.changes?.clicks || 0;
  const impressionChange = data.changes?.impressions || 0;
  const ctrChange = data.changes?.ctr || 0;
  const positionChange = data.changes?.position || 0;
  const bounceRateChange = data.changes?.bounceRate || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Paragraph */}
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <p className="text-gray-700 leading-relaxed">
            This executive summary provides a comprehensive overview of your website's performance across key digital marketing metrics. 
            The analysis combines Google Analytics traffic data with Search Console performance metrics to give you actionable insights 
            into user behavior, search visibility, and conversion opportunities. Each metric includes period-over-period comparisons 
            to help you understand trends and make data-driven decisions for your marketing strategy.
          </p>
        </div>

        {/* Key Performance Indicators */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Key Performance Indicators
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Traffic Metrics */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Sessions</span>
                {getChangeIndicator(sessionChange)}
              </div>
              <div className="text-2xl font-bold">{formatNumber(sessions)}</div>
              <div className={`text-sm ${getChangeColor(sessionChange)}`}>
                {sessionChange > 0 ? '+' : ''}{sessionChange.toFixed(1)}% vs previous period
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total website visits during the period
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Users</span>
                {getChangeIndicator(userChange)}
              </div>
              <div className="text-2xl font-bold">{formatNumber(users)}</div>
              <div className={`text-sm ${getChangeColor(userChange)}`}>
                {userChange > 0 ? '+' : ''}{userChange.toFixed(1)}% vs previous period
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Unique visitors to your website
              </p>
            </div>

            {/* Search Performance */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Organic Clicks</span>
                {getChangeIndicator(clickChange)}
              </div>
              <div className="text-2xl font-bold">{formatNumber(clicks)}</div>
              <div className={`text-sm ${getChangeColor(clickChange)}`}>
                {clickChange > 0 ? '+' : ''}{clickChange.toFixed(1)}% vs previous period
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Clicks from Google search results
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Search Impressions</span>
                {getChangeIndicator(impressionChange)}
              </div>
              <div className="text-2xl font-bold">{formatNumber(impressions)}</div>
              <div className={`text-sm ${getChangeColor(impressionChange)}`}>
                {impressionChange > 0 ? '+' : ''}{impressionChange.toFixed(1)}% vs previous period
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Times your site appeared in search results
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Click-Through Rate</span>
                {getChangeIndicator(ctrChange)}
              </div>
              <div className="text-2xl font-bold">{formatPercentage(ctr)}</div>
              <div className={`text-sm ${getChangeColor(ctrChange)}`}>
                {ctrChange > 0 ? '+' : ''}{(ctrChange * 100).toFixed(1)}% vs previous period
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Percentage of impressions that resulted in clicks
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Average Position</span>
                {getChangeIndicator(-positionChange)} {/* Negative because lower position is better */}
              </div>
              <div className="text-2xl font-bold">{position.toFixed(1)}</div>
              <div className={`text-sm ${getChangeColor(-positionChange)}`}>
                {positionChange > 0 ? '+' : ''}{positionChange.toFixed(1)} vs previous period
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average ranking position in search results
              </p>
            </div>
          </div>
        </div>

        {/* Strategic Commentary */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Strategic Commentary
          </h3>
          <div className="space-y-3">
            {sessionChange < -10 && (
              <div className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                <p className="text-red-800">
                  <strong>Traffic Alert:</strong> Sessions are down {Math.abs(sessionChange).toFixed(1)}%, indicating potential issues with organic visibility or paid campaigns.
                </p>
              </div>
            )}
            
            {ctr < 0.02 && (
              <div className="bg-amber-50 p-3 rounded border-l-4 border-amber-400">
                <p className="text-amber-800">
                  <strong>CTR Opportunity:</strong> Your click-through rate of {formatPercentage(ctr)} is below industry averages (2-3%). Consider optimizing meta titles and descriptions.
                </p>
              </div>
            )}
            
            {position > 10 && (
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <p className="text-blue-800">
                  <strong>Ranking Focus:</strong> Average position of {position.toFixed(1)} suggests opportunities for SEO improvements to increase visibility.
                </p>
              </div>
            )}
            
            {bounceRate > 0.7 && (
              <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-400">
                <p className="text-purple-800">
                  <strong>Engagement Alert:</strong> High bounce rate of {formatPercentage(bounceRate)} may indicate content-audience mismatch or site speed issues.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
