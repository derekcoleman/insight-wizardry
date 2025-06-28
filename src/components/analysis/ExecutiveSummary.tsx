
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target } from "lucide-react";

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

  // Calculate key business metrics
  const trafficGrowth = data.changes?.sessions || 0;
  const conversionGrowth = data.changes?.clicks || 0;
  const visibilityGrowth = data.changes?.impressions || 0;

  // Determine overall performance status
  const getPerformanceStatus = () => {
    const avgGrowth = (trafficGrowth + conversionGrowth + visibilityGrowth) / 3;
    if (avgGrowth >= 10) return { status: "excellent", color: "green", icon: CheckCircle };
    if (avgGrowth >= 5) return { status: "good", color: "blue", icon: TrendingUp };
    if (avgGrowth >= 0) return { status: "stable", color: "yellow", icon: Target };
    return { status: "needs attention", color: "red", icon: AlertTriangle };
  };

  const performance = getPerformanceStatus();
  const StatusIcon = performance.icon;

  // Generate executive insights
  const getExecutiveInsights = () => {
    const insights = [];
    
    if (trafficGrowth > 15) {
      insights.push("🚀 Outstanding traffic growth indicates strong content performance and SEO momentum");
    } else if (trafficGrowth < -10) {
      insights.push("⚠️ Traffic decline requires immediate attention - potential algorithm update or competitive pressure");
    }

    if (conversionGrowth > 20) {
      insights.push("💡 Exceptional click-through performance suggests highly relevant content and strong search positioning");
    }

    if (data.current?.position && data.current.position < 3) {
      insights.push("🎯 Premium search positioning achieved - capitalize with expanded content strategy");
    }

    if (insights.length === 0) {
      insights.push("📊 Performance is stable - consider testing new optimization strategies for growth acceleration");
    }

    return insights;
  };

  // Priority action items
  const getActionItems = () => {
    const actions = [];
    
    if (trafficGrowth < 0) {
      actions.push({
        priority: "High",
        action: "Conduct competitive analysis and content gap assessment",
        impact: "15-25% traffic recovery",
        timeline: "2-4 weeks"
      });
    }

    if (data.current?.ctr && data.current.ctr < 0.02) {
      actions.push({
        priority: "Medium",
        action: "Optimize meta titles and descriptions for better CTR",
        impact: "10-20% click improvement",
        timeline: "1-2 weeks"
      });
    }

    if (conversionGrowth > 0 && trafficGrowth > 0) {
      actions.push({
        priority: "Medium",
        action: "Scale successful content themes and expand keyword targeting",
        impact: "20-30% additional growth",
        timeline: "4-6 weeks"
      });
    }

    return actions;
  };

  const insights = getExecutiveInsights();
  const actionItems = getActionItems();

  return (
    <div className="space-y-6">
      {/* Performance Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Executive Summary</CardTitle>
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-6 w-6 text-${performance.color}-500`} />
              <Badge variant={performance.color === "red" ? "destructive" : "secondary"}>
                {performance.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <p className="text-muted-foreground">{primaryAnalysis.dateRange}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {data.current?.sessions ? (data.current.sessions / 1000).toFixed(1) + 'K' : '0'}
              </div>
              <div className="text-sm text-muted-foreground mb-1">Organic Sessions</div>
              <div className={`flex items-center justify-center gap-1 text-sm ${
                trafficGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trafficGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(trafficGrowth).toFixed(1)}% vs prev period
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {data.current?.clicks ? (data.current.clicks / 1000).toFixed(1) + 'K' : '0'}
              </div>
              <div className="text-sm text-muted-foreground mb-1">Search Clicks</div>
              <div className={`flex items-center justify-center gap-1 text-sm ${
                conversionGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {conversionGrowth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(conversionGrowth).toFixed(1)}% vs prev period
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {data.current?.position ? data.current.position.toFixed(1) : '0'}
              </div>
              <div className="text-sm text-muted-foreground mb-1">Avg Search Position</div>
              <div className={`flex items-center justify-center gap-1 text-sm ${
                (data.changes?.position || 0) <= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(data.changes?.position || 0) <= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(data.changes?.position || 0).toFixed(1)} position change
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Business Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-lg">{insight.split(' ')[0]}</div>
                <div className="text-sm text-gray-700">{insight.slice(insight.indexOf(' ') + 1)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {actionItems.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>
                    {item.priority} Priority
                  </Badge>
                  <span className="text-sm text-muted-foreground">{item.timeline}</span>
                </div>
                <div className="font-medium mb-1">{item.action}</div>
                <div className="text-sm text-green-600">Expected Impact: {item.impact}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
