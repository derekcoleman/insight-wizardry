
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, Target, Users, DollarSign } from "lucide-react";

interface ExecutiveSummaryProps {
  insights: string;
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
}

export function ExecutiveSummary({ insights, analyses }: ExecutiveSummaryProps) {
  if (!analyses.length) return null;

  const primaryAnalysis = analyses[0];
  const current = primaryAnalysis.data.current;
  const changes = primaryAnalysis.data.changes;

  // Calculate key business metrics
  const calculateCAC = () => {
    // Simplified CAC calculation - in real scenario, would need ad spend data
    const sessions = current?.sessions || 0;
    const conversions = current?.conversions || 0;
    if (conversions === 0) return 0;
    // Assuming average $50 cost per 1000 sessions for estimation
    return ((sessions / 1000) * 50) / conversions;
  };

  const calculateCVR = () => {
    const sessions = current?.sessions || 0;
    const conversions = current?.conversions || 0;
    return sessions > 0 ? (conversions / sessions) * 100 : 0;
  };

  const calculateROAS = () => {
    const revenue = current?.revenue || 0;
    const estimatedSpend = ((current?.sessions || 0) / 1000) * 50; // Estimated spend
    return estimatedSpend > 0 ? revenue / estimatedSpend : 0;
  };

  const cac = calculateCAC();
  const cvr = calculateCVR();
  const roas = calculateROAS();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getPerformanceStatus = (metric: string, value: number, change: number) => {
    // Industry benchmarks (simplified)
    const benchmarks = {
      cvr: { good: 2.5, average: 1.5 },
      ctr: { good: 3.0, average: 2.0 },
      roas: { good: 4.0, average: 2.0 }
    };

    const benchmark = benchmarks[metric as keyof typeof benchmarks];
    if (!benchmark) return 'neutral';

    if (value >= benchmark.good) return 'excellent';
    if (value >= benchmark.average) return 'good';
    return 'needs-improvement';
  };

  return (
    <div className="space-y-6">
      {/* Executive KPI Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Executive KPI Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sessions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Sessions</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(current?.sessions || 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(changes?.sessions || 0)}
                <span className={`text-sm ml-1 ${
                  (changes?.sessions || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(changes?.sessions || 0).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 ml-2">vs previous period</span>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-green-900">
                    {cvr.toFixed(2)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center mt-2">
                <Badge variant={getPerformanceStatus('cvr', cvr, 0) === 'excellent' ? 'default' : 'secondary'}>
                  {cvr >= 2.5 ? 'Excellent' : cvr >= 1.5 ? 'Good' : 'Needs Work'}
                </Badge>
              </div>
            </div>

            {/* ROAS */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">ROAS (Est.)</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {roas.toFixed(1)}x
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center mt-2">
                <Badge variant={roas >= 4.0 ? 'default' : 'secondary'}>
                  {roas >= 4.0 ? 'Strong' : roas >= 2.0 ? 'Moderate' : 'Weak'}
                </Badge>
              </div>
            </div>

            {/* CAC */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">CAC (Est.)</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(cac)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-500">
                  Per conversion
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {insights ? (
              <div className="whitespace-pre-wrap">{insights}</div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Executive Summary</h4>
                  <p className="text-blue-800">
                    {(changes?.sessions || 0) >= 0 ? '↗️' : '↘️'} Sessions are {(changes?.sessions || 0) >= 0 ? 'up' : 'down'} {Math.abs(changes?.sessions || 0).toFixed(1)}% - 
                    {(changes?.sessions || 0) >= 0 ? ' indicating strong momentum in traffic acquisition.' : ' suggesting need for traffic diversification strategy.'}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Priority Actions</h4>
                  <ul className="text-green-800 space-y-1">
                    <li>• <strong>High Impact:</strong> Optimize conversion funnel ({cvr < 2.0 ? 'CVR below industry average' : 'maintain CVR performance'})</li>
                    <li>• <strong>Medium Impact:</strong> Expand top-performing traffic channels</li>
                    <li>• <strong>Low Effort:</strong> A/B test key landing pages for +15% CVR lift potential</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">Competitive Positioning</h4>
                  <p className="text-purple-800">
                    Your conversion rate of {cvr.toFixed(2)}% is {cvr >= 2.5 ? 'above' : cvr >= 1.5 ? 'at' : 'below'} industry average (1.5-2.5%). 
                    {cvr < 2.0 ? ' Focus on UX optimization and landing page testing.' : ' Maintain current performance and scale traffic.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
