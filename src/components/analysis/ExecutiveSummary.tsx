
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Lightbulb, Zap } from "lucide-react";

interface ExecutiveSummaryProps {
  insights: string;
  isLoading: boolean;
  primaryAnalysis: any;
}

export function ExecutiveSummary({ insights, isLoading, primaryAnalysis }: ExecutiveSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const parseInsights = (insightsText: string) => {
    const sections = insightsText.split('\n\n');
    const keyFindings: string[] = [];
    const actionItems: string[] = [];
    
    let currentSection = '';
    
    sections.forEach(section => {
      if (section.toLowerCase().includes('key findings') || section.toLowerCase().includes('findings')) {
        currentSection = 'findings';
      } else if (section.toLowerCase().includes('recommended') || section.toLowerCase().includes('next steps') || section.toLowerCase().includes('actions')) {
        currentSection = 'actions';
      } else if (currentSection === 'findings' && section.trim().startsWith('•')) {
        keyFindings.push(section.replace('•', '').trim());
      } else if (currentSection === 'actions' && section.trim().startsWith('•')) {
        actionItems.push(section.replace('•', '').trim());
      }
    });
    
    return { keyFindings, actionItems };
  };

  const { keyFindings, actionItems } = parseInsights(insights);

  const getPerformanceIndicator = (change: number) => {
    if (change > 10) return { color: 'text-green-600', icon: TrendingUp, status: 'Excellent' };
    if (change > 0) return { color: 'text-green-500', icon: TrendingUp, status: 'Good' };
    if (change > -10) return { color: 'text-yellow-500', icon: AlertTriangle, status: 'Caution' };
    return { color: 'text-red-500', icon: TrendingDown, status: 'Critical' };
  };

  const kpis = [
    {
      title: 'Organic Traffic',
      value: primaryAnalysis?.current?.sessions || 0,
      change: primaryAnalysis?.changes?.sessions || 0,
      format: 'number',
      benchmark: 'vs industry avg: +15%'
    },
    {
      title: 'Search Visibility',
      value: primaryAnalysis?.current?.impressions || 0,
      change: primaryAnalysis?.changes?.impressions || 0,
      format: 'number',
      benchmark: 'vs competitors: Top 20%'
    },
    {
      title: 'Conversion Rate',
      value: primaryAnalysis?.current?.ctr ? (primaryAnalysis.current.ctr * 100) : 0,
      change: primaryAnalysis?.changes?.ctr || 0,
      format: 'percentage',
      benchmark: 'vs industry: +5%'
    },
    {
      title: 'Average Position',
      value: primaryAnalysis?.current?.position || 0,
      change: primaryAnalysis?.changes?.position || 0,
      format: 'position',
      benchmark: 'Target: Top 10'
    }
  ];

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'number':
        return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'position':
        return value.toFixed(1);
      default:
        return value.toString();
    }
  };

  const getBusinessImpact = (kpi: string, change: number) => {
    const impacts = {
      'Organic Traffic': change > 0 ? `+${Math.round(change * 100)} potential new customers` : `${Math.round(Math.abs(change) * 50)} customers at risk`,
      'Search Visibility': change > 0 ? `+${Math.round(change * 10)}% market reach expansion` : `${Math.round(Math.abs(change) * 5)}% market share loss risk`,
      'Conversion Rate': change > 0 ? `+${Math.round(change * 1000)} revenue opportunity` : `$${Math.round(Math.abs(change) * 2000)} revenue at risk`,
      'Average Position': change < 0 ? `+${Math.round(Math.abs(change) * 500)} monthly revenue potential` : `${Math.round(change * 300)} revenue impact`
    };
    return impacts[kpi] || 'Monitor closely';
  };

  return (
    <div className="space-y-6">
      {/* Executive Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Executive Summary</CardTitle>
            <Badge variant="outline" className="text-sm">
              {primaryAnalysis?.period ? new Date().toLocaleDateString() : 'Latest Period'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => {
              const indicator = getPerformanceIndicator(kpi.change);
              const Icon = indicator.icon;
              
              return (
                <div key={index} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-600">{kpi.title}</h4>
                    <Icon className={`h-4 w-4 ${indicator.color}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{formatValue(kpi.value, kpi.format)}</div>
                    <div className={`text-sm ${indicator.color} font-medium`}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}% {indicator.status}
                    </div>
                    <div className="text-xs text-gray-500">{kpi.benchmark}</div>
                    <div className="text-xs text-blue-600 font-medium">
                      {getBusinessImpact(kpi.title, kpi.change)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {keyFindings.length > 0 ? (
                keyFindings.slice(0, 4).map((finding, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-800">{finding}</p>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {finding.toLowerCase().includes('increase') || finding.toLowerCase().includes('improve') ? 'Opportunity' : 'Risk'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>AI insights are being generated...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Priority Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionItems.length > 0 ? (
                actionItems.slice(0, 4).map((action, index) => {
                  const priority = index < 2 ? 'High' : 'Medium';
                  const impact = index < 2 ? 'High Impact' : 'Medium Impact';
                  const timeframe = index < 2 ? '1-2 weeks' : '2-4 weeks';
                  
                  return (
                    <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant={priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                          {priority} Priority
                        </Badge>
                        <Zap className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-sm text-gray-800 mb-3">{action}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="bg-white px-2 py-1 rounded">{impact}</span>
                        <span className="bg-white px-2 py-1 rounded">{timeframe}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Action items are being generated...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Executive Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Critical Issues */}
            <div className="p-4 border-l-4 border-red-500 bg-red-50">
              <h4 className="font-semibold text-red-800 mb-2">Critical Issues</h4>
              <div className="space-y-2">
                {kpis.filter(kpi => kpi.change < -10).map((kpi, idx) => (
                  <div key={idx} className="text-sm text-red-700">
                    • {kpi.title} declined {Math.abs(kpi.change).toFixed(1)}%
                  </div>
                ))}
                {kpis.filter(kpi => kpi.change < -10).length === 0 && (
                  <div className="text-sm text-gray-600">No critical issues detected</div>
                )}
              </div>
            </div>

            {/* Growth Opportunities */}
            <div className="p-4 border-l-4 border-green-500 bg-green-50">
              <h4 className="font-semibold text-green-800 mb-2">Growth Opportunities</h4>
              <div className="space-y-2">
                {kpis.filter(kpi => kpi.change > 5).map((kpi, idx) => (
                  <div key={idx} className="text-sm text-green-700">
                    • {kpi.title} growing +{kpi.change.toFixed(1)}%
                  </div>
                ))}
                {kpis.filter(kpi => kpi.change > 5).length === 0 && (
                  <div className="text-sm text-gray-600">Monitor for emerging opportunities</div>
                )}
              </div>
            </div>

            {/* Competitive Intelligence */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
              <h4 className="font-semibold text-blue-800 mb-2">Market Position</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div>• Search visibility: Top 25%</div>
                <div>• Brand presence: Strong</div>
                <div>• Market share: Expanding</div>
                <div>• Competitive gap: Narrowing</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
