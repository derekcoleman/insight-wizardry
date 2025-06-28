
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, MousePointer, Users, Target } from "lucide-react";

interface ConversionFunnelProps {
  data: {
    impressions?: number;
    clicks?: number;
    sessions?: number;
    conversions?: number;
    changes?: {
      impressions?: number;
      clicks?: number;
      sessions?: number;
      conversions?: number;
    };
  };
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const { impressions = 0, clicks = 0, sessions = 0, conversions = 0, changes } = data;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  };

  const ctr = calculateRate(clicks, impressions);
  const clickToSession = calculateRate(sessions, clicks);
  const conversionRate = calculateRate(conversions, sessions);

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const funnelSteps = [
    {
      title: 'Impressions',
      value: impressions,
      icon: Eye,
      color: 'bg-blue-500',
      change: changes?.impressions,
      description: 'Times your site appeared in search results'
    },
    {
      title: 'Clicks',
      value: clicks,
      icon: MousePointer,
      color: 'bg-green-500',
      change: changes?.clicks,
      rate: ctr,
      rateLabel: 'CTR',
      description: 'Users who clicked through to your site'
    },
    {
      title: 'Sessions',
      value: sessions,
      icon: Users,
      color: 'bg-purple-500',
      change: changes?.sessions,
      rate: clickToSession,
      rateLabel: 'Click-to-Session',
      description: 'Unique visits to your website'
    },
    {
      title: 'Conversions',
      value: conversions,
      icon: Target,
      color: 'bg-orange-500',
      change: changes?.conversions,
      rate: conversionRate,
      rateLabel: 'Conversion Rate',
      description: 'Users who completed your goal action'
    }
  ];

  // Calculate funnel drop-off rates
  const getDropoffRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((previous - current) / previous) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel Analysis</CardTitle>
        <p className="text-sm text-muted-foreground">
          Track user journey from search impressions to conversions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Funnel Visualization */}
          <div className="relative">
            {funnelSteps.map((step, index) => {
              const isLast = index === funnelSteps.length - 1;
              const previousStep = index > 0 ? funnelSteps[index - 1] : null;
              const dropoffRate = previousStep ? getDropoffRate(step.value, previousStep.value) : 0;
              
              return (
                <div key={step.title} className="relative">
                  {/* Funnel Step */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4">
                    <div className={`p-3 rounded-full ${step.color} text-white`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-lg">{step.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xl">{formatNumber(step.value)}</span>
                          {step.change !== undefined && (
                            <div className="flex items-center space-x-1">
                              {getChangeIcon(step.change)}
                              <span className={`text-sm font-medium ${getChangeColor(step.change)}`}>
                                {Math.abs(step.change).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      
                      <div className="flex items-center justify-between">
                        {step.rate !== undefined && (
                          <div className="text-sm">
                            <span className="font-medium">{step.rateLabel}: </span>
                            <span className={`font-semibold ${
                              step.rateLabel === 'CTR' ? (step.rate >= 2 ? 'text-green-600' : 'text-orange-600') :
                              step.rateLabel === 'Conversion Rate' ? (step.rate >= 2 ? 'text-green-600' : 'text-orange-600') :
                              'text-blue-600'
                            }`}>
                              {step.rate.toFixed(2)}%
                            </span>
                          </div>
                        )}
                        
                        {dropoffRate > 0 && (
                          <div className="text-sm text-gray-500">
                            Drop-off: {dropoffRate.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Arrow */}
                  {!isLast && (
                    <div className="flex justify-center mb-4">
                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-300"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Funnel Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Overall CTR</h4>
              <p className="text-2xl font-bold text-blue-600">{ctr.toFixed(2)}%</p>
              <p className="text-sm text-blue-700">
                {ctr >= 2 ? 'Above average' : 'Below average (2%+ is good)'}
              </p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800">Session Quality</h4>
              <p className="text-2xl font-bold text-green-600">{clickToSession.toFixed(1)}%</p>
              <p className="text-sm text-green-700">
                Clicks that become sessions
              </p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800">Conversion Rate</h4>
              <p className="text-2xl font-bold text-orange-600">{conversionRate.toFixed(2)}%</p>
              <p className="text-sm text-orange-700">
                {conversionRate >= 2 ? 'Strong performance' : conversions === 0 ? 'No conversions tracked' : 'Room for improvement'}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Quick Recommendations</h4>
            <div className="space-y-2 text-sm">
              {ctr < 2 && (
                <p className="text-orange-600">• Improve CTR by optimizing meta titles and descriptions</p>
              )}
              {clickToSession < 80 && (
                <p className="text-blue-600">• Reduce bounce rate by improving page load speed and relevance</p>
              )}
              {conversionRate < 2 && conversions > 0 && (
                <p className="text-purple-600">• Optimize conversion funnel and call-to-action placement</p>
              )}
              {conversions === 0 && sessions > 100 && (
                <p className="text-red-600">• Set up conversion tracking to measure goal completions</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
