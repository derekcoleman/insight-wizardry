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

interface RelatedQuery {
  query: string;
  value: number;
  trend: "rising" | "steady" | "declining";
}

interface TrendsData {
  interest_over_time: any[];
  related_queries: Record<string, {
    top: RelatedQuery[];
    rising: RelatedQuery[];
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

  const renderKeywordInsights = (keyword: string) => {
    const queries = trendsData?.related_queries[keyword];
    if (!queries) return null;

    return (
      <Card key={keyword} className="p-4">
        <h3 className="font-medium mb-4">{keyword}</h3>
        
        {/* Related Queries Section */}
        <div className="space-y-4">
          {/* Top Related Queries */}
          <div>
            <h4 className="text-sm font-medium mb-2">Related Queries:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {queries.top.slice(0, 3).map((query, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center bg-muted p-2 rounded"
                >
                  <span className="text-sm">{query.query}</span>
                  <span className={`text-xs ${
                    query.trend === "rising" ? "text-green-500" : 
                    query.trend === "declining" ? "text-red-500" : 
                    "text-gray-500"
                  }`}>
                    {query.trend === "rising" ? "↑" : 
                     query.trend === "declining" ? "↓" : 
                     "→"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakout Queries */}
          {queries.rising.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Trending Queries:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {queries.rising.slice(0, 2).map((query, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center bg-green-50 p-2 rounded border border-green-100"
                  >
                    <span className="text-sm">{query.query}</span>
                    <span className="text-xs text-green-600">Breakout</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Search Trends Analysis</CardTitle>
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
            {/* Key Insights */}
            {trendsData.analysis && (
              <div className="space-y-4">
                {/* Seasonal Patterns */}
                {trendsData.analysis.seasonal_patterns.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Seasonal Patterns</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {trendsData.analysis.seasonal_patterns.map((pattern, i) => (
                        <li key={i} className="text-sm">{pattern}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Trending Topics */}
                {trendsData.analysis.trending_topics.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Trending Topics</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {trendsData.analysis.trending_topics.map((topic, i) => (
                        <li key={i} className="text-sm">{topic}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Recommendations */}
                {trendsData.analysis.keyword_recommendations.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-2">Content Recommendations</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {trendsData.analysis.keyword_recommendations.map((rec, i) => (
                        <li key={i} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}
            
            {/* Search Interest Over Time */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.interest_over_time}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {keywords.slice(0, 5).map((keyword, index) => (
                    <Line
                      key={keyword}
                      type="monotone"
                      dataKey={keyword}
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Keyword-specific insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keywords.slice(0, 5).map(keyword => renderKeywordInsights(keyword))}
            </div>
          </div>
        )}

        {!trendsData && !isLoading && (
          <p className="text-muted-foreground">
            Click "Analyze Trends" to see search trends and related queries for your keywords.
          </p>
        )}
      </CardContent>
    </Card>
  );
}