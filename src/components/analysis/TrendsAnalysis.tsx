import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TrendsAnalysisProps {
  keywords: string[];
}

interface TrendsData {
  interest_over_time: any[];
  related_queries: Record<string, {
    top: { query: string; value: number }[];
    rising: { query: string; value: number }[];
  }>;
  analysis?: {
    seasonal_patterns: string[];
    trending_topics: string[];
    keyword_recommendations: string[];
  };
}

export function TrendsAnalysis({ keywords }: TrendsAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const { toast } = useToast();

  const analyzeTrends = async () => {
    if (!keywords.length) {
      toast({
        title: "No Keywords",
        description: "Please provide keywords to analyze trends",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: trendsResult, error: trendsError } = await supabase.functions.invoke('google-trends', {
        body: { keywords: keywords.slice(0, 5) }
      });

      if (trendsError) throw trendsError;

      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('analyze-trends', {
        body: { 
          keywords,
          trendsData: trendsResult
        }
      });

      if (analysisError) throw analysisError;

      setTrendsData({
        ...trendsResult,
        analysis: analysisResult?.analysis
      });
      
      toast({
        title: "Success",
        description: "Trends analysis completed",
      });
    } catch (error) {
      console.error('Error analyzing trends:', error);
      toast({
        title: "Error",
        description: "Failed to analyze trends. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-medium mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium">{entry.value}% interest</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Search Interest Analysis</CardTitle>
          <Button
            onClick={analyzeTrends}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Trends
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {trendsData && (
          <div className="space-y-6">
            {/* Search Interest Over Time */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Search Interest Trends</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData.interest_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Relative Search Interest (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: '#6b7280' }
                      }}
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {keywords.slice(0, 5).map((keyword, index) => (
                      <Line
                        key={keyword}
                        type="monotone"
                        dataKey={keyword}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                        name={keyword}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* AI-Generated Insights */}
            {trendsData.analysis && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Seasonal Patterns */}
                {trendsData.analysis.seasonal_patterns.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Search Patterns</h3>
                    <ul className="list-disc pl-4 space-y-2">
                      {trendsData.analysis.seasonal_patterns.map((pattern, i) => (
                        <li key={i} className="text-gray-700 text-sm">{pattern}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Trending Topics */}
                {trendsData.analysis.trending_topics.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Growing Search Terms</h3>
                    <ul className="list-disc pl-4 space-y-2">
                      {trendsData.analysis.trending_topics.map((topic, i) => (
                        <li key={i} className="text-gray-700 text-sm">{topic}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Content Recommendations */}
                {trendsData.analysis.keyword_recommendations.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Content Opportunities</h3>
                    <ul className="list-disc pl-4 space-y-2">
                      {trendsData.analysis.keyword_recommendations.map((rec, i) => (
                        <li key={i} className="text-gray-700 text-sm">{rec}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {!trendsData && !isLoading && (
          <p className="text-muted-foreground">
            Click "Analyze Trends" to see search trends and insights for your keywords.
          </p>
        )}
      </CardContent>
    </Card>
  );
}