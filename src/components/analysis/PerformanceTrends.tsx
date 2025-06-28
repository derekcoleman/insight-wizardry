
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface PerformanceTrendsProps {
  analyses: Array<{
    type: string;
    data: any;
    title: string;
    dateRange: string;
  }>;
}

export function PerformanceTrends({ analyses }: PerformanceTrendsProps) {
  if (!analyses.length) return null;

  // Create time series data from analyses
  const timeSeriesData = analyses.map((analysis, index) => ({
    period: analysis.type.replace(' over ', ' to ').replace('Weekly', 'W').replace('Monthly', 'M').replace('Quarterly', 'Q').replace('YTD', 'YTD'),
    sessions: analysis.data.current?.sessions || 0,
    clicks: analysis.data.current?.clicks || 0,
    impressions: analysis.data.current?.impressions || 0,
    ctr: (analysis.data.current?.ctr || 0) * 100,
    position: analysis.data.current?.position || 0,
    bounceRate: (analysis.data.current?.bounceRate || 0) * 100,
    index: index
  })).reverse(); // Reverse to show chronological order

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">
                {entry.dataKey === 'ctr' || entry.dataKey === 'bounceRate' 
                  ? `${entry.value.toFixed(1)}%` 
                  : entry.dataKey === 'position'
                  ? entry.value.toFixed(1)
                  : formatNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Traffic Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic & Engagement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={formatNumber} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stackId="1"
                  stroke="#0088FE" 
                  fill="#0088FE" 
                  fillOpacity={0.3}
                  name="Sessions"
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stackId="2"
                  stroke="#00C49F" 
                  fill="#00C49F" 
                  fillOpacity={0.3}
                  name="Clicks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Search Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={formatNumber} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="impressions" 
                    stroke="#FFBB28" 
                    strokeWidth={3}
                    dot={{ fill: '#FFBB28', strokeWidth: 2, r: 4 }}
                    name="Impressions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Position & CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" stroke="#666" />
                  <YAxis yAxisId="left" stroke="#666" />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="position" 
                    stroke="#FF8042" 
                    strokeWidth={3}
                    dot={{ fill: '#FF8042', strokeWidth: 2, r: 4 }}
                    name="Avg Position"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="#8884D8" 
                    strokeWidth={3}
                    dot={{ fill: '#8884D8', strokeWidth: 2, r: 4 }}
                    name="CTR %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analyses[0] && (
              <>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {((analyses[0].data.current?.ctr || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Current CTR</div>
                  <div className="text-xs text-gray-500 mt-1">Industry avg: 2.1%</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analyses[0].data.current?.position?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Position</div>
                  <div className="text-xs text-gray-500 mt-1">Target: &lt;5.0</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {((analyses[0].data.current?.bounceRate || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Bounce Rate</div>
                  <div className="text-xs text-gray-500 mt-1">Industry avg: 58%</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(analyses[0].data.current?.impressions || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Impressions</div>
                  <div className="text-xs text-gray-500 mt-1">Visibility metric</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
