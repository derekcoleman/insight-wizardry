
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Funnel, TrendingUp, TrendingDown } from "lucide-react";

interface ConversionFunnelProps {
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
}

export function ConversionFunnel({ analyses }: ConversionFunnelProps) {
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

  // Calculate conversion metrics
  const impressions = data.current?.impressions || 0;
  const clicks = data.current?.clicks || 0;
  const sessions = data.current?.sessions || 0;
  const users = data.current?.users || 0;

  const ctr = impressions > 0 ? clicks / impressions : 0;
  const sessionRate = clicks > 0 ? sessions / clicks : 0;
  const userConversion = sessions > 0 ? users / sessions : 0;

  const funnelSteps = [
    {
      name: "Search Impressions",
      value: impressions,
      percentage: 100,
      description: "Times your site appeared in search results"
    },
    {
      name: "Organic Clicks",
      value: clicks,
      percentage: impressions > 0 ? (clicks / impressions) * 100 : 0,
      description: "Users who clicked from search results"
    },
    {
      name: "Website Sessions",
      value: sessions,
      percentage: clicks > 0 ? (sessions / clicks) * 100 : 0,
      description: "Clicks that resulted in website visits"
    },
    {
      name: "Unique Users",
      value: users,
      percentage: sessions > 0 ? (users / sessions) * 100 : 0,
      description: "Sessions from unique visitors"
    }
  ];

  const getChangeIndicator = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Funnel className="h-5 w-5" />
          Conversion Funnel Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Funnel Description */}
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <p className="text-gray-700 leading-relaxed">
            This conversion funnel tracks the user journey from search visibility to website engagement. 
            Understanding each step helps identify optimization opportunities and conversion bottlenecks 
            in your digital marketing strategy.
          </p>
        </div>

        {/* Funnel Steps */}
        <div className="space-y-4">
          {funnelSteps.map((step, index) => (
            <div key={step.name} className="relative">
              <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{step.name}</h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatNumber(step.value)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {step.percentage.toFixed(1)}% of previous step
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(step.percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              
              {/* Arrow between steps */}
              {index < funnelSteps.length - 1 && (
                <div className="flex justify-center py-2">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[15px] border-l-transparent border-r-transparent border-t-gray-400"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-semibold text-blue-800 mb-2">Click-Through Rate</h5>
            <div className="text-2xl font-bold text-blue-900">{formatPercentage(ctr)}</div>
            <p className="text-sm text-blue-700">From impressions to clicks</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-semibold text-green-800 mb-2">Session Conversion</h5>
            <div className="text-2xl font-bold text-green-900">{formatPercentage(sessionRate)}</div>
            <p className="text-sm text-green-700">From clicks to sessions</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h5 className="font-semibold text-purple-800 mb-2">User Engagement</h5>
            <div className="text-2xl font-bold text-purple-900">{formatPercentage(userConversion)}</div>
            <p className="text-sm text-purple-700">From sessions to unique users</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
