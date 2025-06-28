
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface ConversionFunnelProps {
  analysis: {
    data: {
      current?: {
        impressions?: number;
        clicks?: number;
        sessions?: number;
        conversions?: number;
        ctr?: number;
        bounceRate?: number;
      };
      changes?: {
        impressions?: number;
        clicks?: number;
        sessions?: number;
        conversions?: number;
      };
    };
  };
}

export function ConversionFunnel({ analysis }: ConversionFunnelProps) {
  const current = analysis.data.current;
  const changes = analysis.data.changes;

  if (!current) return null;

  const impressions = current.impressions || 0;
  const clicks = current.clicks || 0;
  const sessions = current.sessions || 0;
  const conversions = current.conversions || 0;

  // Calculate conversion rates
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const clickToSession = clicks > 0 ? (sessions / clicks) * 100 : 0;
  const sessionToConversion = sessions > 0 ? (conversions / sessions) * 100 : 0;

  // Calculate drop-off rates
  const impressionDropoff = impressions > 0 ? ((impressions - clicks) / impressions) * 100 : 0;
  const clickDropoff = clicks > 0 ? ((clicks - sessions) / clicks) * 100 : 0;
  const sessionDropoff = sessions > 0 ? ((sessions - conversions) / sessions) * 100 : 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const getPerformanceColor = (rate: number, thresholds: { good: number; average: number }) => {
    if (rate >= thresholds.good) return 'text-green-600 bg-green-50';
    if (rate >= thresholds.average) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getOptimizationSuggestion = (stage: string, rate: number) => {
    const suggestions = {
      ctr: rate < 2.0 ? 'Optimize ad copy and targeting' : rate < 4.0 ? 'Test new ad creatives' : 'Scale high-performing ads',
      clickToSession: rate < 80 ? 'Check for technical issues or bot traffic' : rate < 90 ? 'Optimize page load speed' : 'Maintain current performance',
      conversion: rate < 1.0 ? 'Revamp landing page UX' : rate < 2.5 ? 'A/B test CTA and forms' : 'Focus on scaling traffic'
    };
    return suggestions[stage as keyof typeof suggestions] || '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversion Funnel Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Funnel Visualization */}
          <div className="relative">
            {/* Impressions */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Impressions</h3>
                  <p className="text-2xl font-bold text-blue-700">{formatNumber(impressions)}</p>
                  <p className="text-sm text-blue-600">Search visibility</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {(changes?.impressions || 0) >= 0 ? '+' : ''}{(changes?.impressions || 0).toFixed(1)}%
                </Badge>
                <p className="text-xs text-gray-500">vs previous period</p>
              </div>
            </div>

            <div className="flex justify-center my-2">
              <ArrowDown className="h-6 w-6 text-gray-400" />
            </div>

            {/* Clicks */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Clicks</h3>
                  <p className="text-2xl font-bold text-green-700">{formatNumber(clicks)}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getPerformanceColor(ctr, { good: 4.0, average: 2.0 })}>
                      {ctr.toFixed(2)}% CTR
                    </Badge>
                    {impressionDropoff > 0 && (
                      <span className="text-xs text-red-500">
                        -{impressionDropoff.toFixed(1)}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {(changes?.clicks || 0) >= 0 ? '+' : ''}{(changes?.clicks || 0).toFixed(1)}%
                </Badge>
                <p className="text-xs text-gray-500">
                  {getOptimizationSuggestion('ctr', ctr)}
                </p>
              </div>
            </div>

            <div className="flex justify-center my-2">
              <ArrowDown className="h-6 w-6 text-gray-400" />
            </div>

            {/* Sessions */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Sessions</h3>
                  <p className="text-2xl font-bold text-purple-700">{formatNumber(sessions)}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getPerformanceColor(clickToSession, { good: 90, average: 80 })}>
                      {clickToSession.toFixed(1)}% of clicks
                    </Badge>
                    {clickDropoff > 0 && (
                      <span className="text-xs text-red-500">
                        -{clickDropoff.toFixed(1)}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {(changes?.sessions || 0) >= 0 ? '+' : ''}{(changes?.sessions || 0).toFixed(1)}%
                </Badge>
                <p className="text-xs text-gray-500">
                  {getOptimizationSuggestion('clickToSession', clickToSession)}
                </p>
              </div>
            </div>

            <div className="flex justify-center my-2">
              <ArrowDown className="h-6 w-6 text-gray-400" />
            </div>

            {/* Conversions */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Conversions</h3>
                  <p className="text-2xl font-bold text-orange-700">{formatNumber(conversions)}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={getPerformanceColor(sessionToConversion, { good: 2.5, average: 1.5 })}>
                      {sessionToConversion.toFixed(2)}% CVR
                    </Badge>
                    {sessionDropoff > 0 && (
                      <span className="text-xs text-red-500">
                        -{sessionDropoff.toFixed(1)}% drop-off
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">
                  {(changes?.conversions || 0) >= 0 ? '+' : ''}{(changes?.conversions || 0).toFixed(1)}%
                </Badge>
                <p className="text-xs text-gray-500">
                  {getOptimizationSuggestion('conversion', sessionToConversion)}
                </p>
              </div>
            </div>
          </div>

          {/* Optimization Opportunities */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Optimization Opportunities
            </h4>
            <div className="space-y-2">
              {ctr < 2.0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">High Priority</Badge>
                  <span className="text-sm">CTR below 2% - optimize ad copy and targeting (+{((2.0 - ctr) / ctr * 100).toFixed(0)}% potential lift)</span>
                </div>
              )}
              {clickToSession < 80 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">High Priority</Badge>
                  <span className="text-sm">High click-to-session drop-off - check for bot traffic or technical issues</span>
                </div>
              )}
              {sessionToConversion < 1.5 && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">High Priority</Badge>
                  <span className="text-sm">Low conversion rate - revamp landing page UX (+{((1.5 - sessionToConversion) / sessionToConversion * 100).toFixed(0)}% potential lift)</span>
                </div>
              )}
              {ctr >= 2.0 && clickToSession >= 80 && sessionToConversion >= 1.5 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">Funnel performing well - focus on scaling traffic</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
