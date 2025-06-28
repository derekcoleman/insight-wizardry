
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Target, Trophy, Zap } from "lucide-react";

interface ExecutiveSummaryProps {
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
  insights?: string;
}

export function ExecutiveSummary({ analyses, insights }: ExecutiveSummaryProps) {
  if (!analyses.length) return null;

  const primaryAnalysis = analyses[0];
  const currentData = primaryAnalysis.data.current;
  const changes = primaryAnalysis.data.changes;

  // Calculate key metrics
  const totalSessions = currentData?.sessions || 0;
  const totalClicks = currentData?.clicks || 0;
  const totalConversions = currentData?.conversions || 0;
  const revenue = currentData?.revenue || 0;
  const ctr = currentData?.ctr ? (currentData.ctr * 100) : 0;
  const avgPosition = currentData?.position || 0;

  // Determine overall performance status
  const getPerformanceStatus = () => {
    const positiveMetrics = [
      changes?.sessions > 0,
      changes?.clicks > 0,
      changes?.conversions > 0,
      changes?.revenue > 0,
      changes?.ctr > 0,
      changes?.position < 0 // Better position means lower number
    ].filter(Boolean).length;

    if (positiveMetrics >= 4) return { status: 'excellent', color: 'bg-green-500', label: 'Excellent' };
    if (positiveMetrics >= 2) return { status: 'good', color: 'bg-blue-500', label: 'Good' };
    return { status: 'needs-attention', color: 'bg-orange-500', label: 'Needs Attention' };
  };

  const performanceStatus = getPerformanceStatus();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const getChangeIcon = (change: number, isPosition = false) => {
    const isPositive = isPosition ? change < 0 : change > 0;
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
    );
  };

  const getChangeColor = (change: number, isPosition = false) => {
    const isPositive = isPosition ? change < 0 : change > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  // Generate action items based on data
  const generateActionItems = () => {
    const actions = [];
    
    if (changes?.position > 10) {
      actions.push({
        priority: 'High',
        action: 'Improve SEO Rankings',
        impact: 'Could increase organic traffic by 25-40%',
        description: 'Average position declined significantly - focus on content optimization and technical SEO'
      });
    }
    
    if (changes?.ctr < -10) {
      actions.push({
        priority: 'High',
        action: 'Optimize Meta Titles & Descriptions',
        impact: 'Could improve CTR by 15-25%',
        description: 'Low click-through rates indicate poor meta descriptions or titles'
      });
    }
    
    if (changes?.conversions < 0 && totalConversions > 0) {
      actions.push({
        priority: 'Medium',
        action: 'Review Conversion Funnel',
        impact: 'Could recover 10-20% conversion rate',
        description: 'Conversion rate is declining - analyze user journey and landing pages'
      });
    }
    
    if (totalSessions > 1000 && revenue < 100) {
      actions.push({
        priority: 'Medium',
        action: 'Implement Monetization Strategy',
        impact: 'Could generate $500-2000 additional revenue',
        description: 'High traffic but low revenue suggests missed monetization opportunities'
      });
    }

    return actions.slice(0, 3); // Show top 3 actions
  };

  const actionItems = generateActionItems();

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Executive Performance Summary
            </CardTitle>
            <Badge className={`${performanceStatus.color} text-white`}>
              {performanceStatus.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Key Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Key Performance Indicators</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Total Sessions</span>
                  <div className="flex items-center">
                    <span className="font-bold">{formatNumber(totalSessions)}</span>
                    {changes?.sessions && getChangeIcon(changes.sessions)}
                    <span className={`text-sm ml-1 ${getChangeColor(changes?.sessions || 0)}`}>
                      {Math.abs(changes?.sessions || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Organic Clicks</span>
                  <div className="flex items-center">
                    <span className="font-bold">{formatNumber(totalClicks)}</span>
                    {changes?.clicks && getChangeIcon(changes.clicks)}
                    <span className={`text-sm ml-1 ${getChangeColor(changes?.clicks || 0)}`}>
                      {Math.abs(changes?.clicks || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Conversions</span>
                  <div className="flex items-center">
                    <span className="font-bold">{totalConversions}</span>
                    {changes?.conversions && getChangeIcon(changes.conversions)}
                    <span className={`text-sm ml-1 ${getChangeColor(changes?.conversions || 0)}`}>
                      {Math.abs(changes?.conversions || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {revenue > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Revenue</span>
                    <div className="flex items-center">
                      <span className="font-bold">{formatCurrency(revenue)}</span>
                      {changes?.revenue && getChangeIcon(changes.revenue)}
                      <span className={`text-sm ml-1 ${getChangeColor(changes?.revenue || 0)}`}>
                        {Math.abs(changes?.revenue || 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* What This Means */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What This Means</h3>
              <div className="space-y-3 text-sm">
                {changes?.sessions > 10 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Strong Traffic Growth</p>
                      <p className="text-green-700">Your organic traffic is increasing, indicating better search visibility.</p>
                    </div>
                  </div>
                )}

                {changes?.sessions < -10 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Traffic Decline</p>
                      <p className="text-red-700">Organic traffic is dropping, likely due to ranking changes or seasonal factors.</p>
                    </div>
                  </div>
                )}

                {ctr < 2 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Low Click-Through Rate</p>
                      <p className="text-orange-700">Your CTR of {ctr.toFixed(1)}% is below average. Optimize meta descriptions.</p>
                    </div>
                  </div>
                )}

                {avgPosition > 20 && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-800">Poor Average Position</p>
                      <p className="text-orange-700">Average position of {avgPosition.toFixed(1)} needs improvement for better visibility.</p>
                    </div>
                  </div>
                )}

                {totalConversions === 0 && totalSessions > 100 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Conversion Opportunity</p>
                      <p className="text-blue-700">High traffic but no conversions tracked. Set up conversion goals.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Competitive Context */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Industry Benchmark</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">Click-Through Rate</p>
                  <div className="flex justify-between mt-1">
                    <span>Your CTR: {ctr.toFixed(1)}%</span>
                    <span className={ctr >= 2 ? 'text-green-600' : 'text-orange-600'}>
                      {ctr >= 2 ? 'Above Average' : 'Below Average'}
                    </span>
                  </div>
                  <p className="text-blue-700 text-xs mt-1">Industry average: 2.0%</p>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-800">Average Position</p>
                  <div className="flex justify-between mt-1">
                    <span>Your Position: {avgPosition.toFixed(1)}</span>
                    <span className={avgPosition <= 10 ? 'text-green-600' : 'text-orange-600'}>
                      {avgPosition <= 10 ? 'First Page' : 'Second Page+'}
                    </span>
                  </div>
                  <p className="text-purple-700 text-xs mt-1">Target: Top 10 positions</p>
                </div>

                {totalSessions > 0 && totalConversions > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-800">Conversion Rate</p>
                    <div className="flex justify-between mt-1">
                      <span>{((totalConversions / totalSessions) * 100).toFixed(2)}%</span>
                      <span className={((totalConversions / totalSessions) * 100) >= 2 ? 'text-green-600' : 'text-orange-600'}>
                        {((totalConversions / totalSessions) * 100) >= 2 ? 'Good' : 'Needs Work'}
                      </span>
                    </div>
                    <p className="text-green-700 text-xs mt-1">Industry average: 2-3%</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Action Items */}
      {actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Priority Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionItems.map((item, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{item.action}</h4>
                    <Badge variant={item.priority === 'High' ? 'destructive' : 'secondary'}>
                      {item.priority} Priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                  <p className="text-sm font-medium text-green-600">
                    Expected Impact: {item.impact}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
