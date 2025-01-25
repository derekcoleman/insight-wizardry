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
}

interface TrendsData {
  interest_over_time: any[];
  related_queries: Record<string, {
    top: RelatedQuery[];
    rising: RelatedQuery[];
  }>;
  analysis?: string;
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
      // First get trends data
      const { data: trendsResult, error: trendsError } = await supabase.functions.invoke('google-trends', {
        body: { keywords: keywords.slice(0, 5) }
      });

      if (trendsError) throw trendsError;

      // Then get AI analysis of the trends
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

  const renderRelatedQueries = (keyword: string) => {
    const queries = trendsData?.related_queries[keyword];
    if (!queries) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Top Related Queries:</h4>
        <ul className="text-sm space-y-1">
          {queries.top.slice(0, 3).map((query, index) => (
            <li key={index} className="flex justify-between">
              <span>{query.query}</span>
              <span className="text-muted-foreground">{query.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Google Trends Analysis</CardTitle>
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
            {trendsData.analysis && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">{trendsData.analysis}</p>
              </div>
            )}
            
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {keywords.slice(0, 5).map(keyword => (
                <Card key={keyword} className="p-4">
                  <h3 className="font-medium mb-3">{keyword}</h3>
                  {renderRelatedQueries(keyword)}
                </Card>
              ))}
            </div>
          </div>
        )}

        {!trendsData && !isLoading && (
          <p className="text-muted-foreground">
            Click "Analyze Trends" to see Google Trends data for your keywords.
          </p>
        )}
      </CardContent>
    </Card>
  );
}