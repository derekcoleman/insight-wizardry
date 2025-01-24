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

export function TrendsAnalysis({ keywords }: TrendsAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [trendsData, setTrendsData] = useState<any>(null);
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
      const { data, error } = await supabase.functions.invoke('google-trends', {
        body: { keywords: keywords.slice(0, 5) } // Google Trends API limits to 5 keywords
      });

      if (error) throw error;
      setTrendsData(data);
      
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
            <div className="h-[400px]">
              <h3 className="text-lg font-semibold mb-4">Interest Over Time</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {keywords.slice(0, 5).map((keyword) => (
                <div key={keyword} className="space-y-4">
                  <h4 className="text-lg font-semibold">{keyword}</h4>
                  
                  {trendsData.related_queries[keyword] && (
                    <div>
                      <h5 className="font-medium mb-2">Related Queries</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h6 className="text-sm font-medium mb-1">Top</h6>
                          <ul className="text-sm space-y-1">
                            {trendsData.related_queries[keyword].top.slice(0, 5).map((query: any) => (
                              <li key={query.query}>
                                {query.query} ({query.value})
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-sm font-medium mb-1">Rising</h6>
                          <ul className="text-sm space-y-1">
                            {trendsData.related_queries[keyword].rising.slice(0, 5).map((query: any) => (
                              <li key={query.query}>
                                {query.query} ({query.value}%)
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {trendsData.related_topics[keyword] && (
                    <div>
                      <h5 className="font-medium mb-2">Related Topics</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h6 className="text-sm font-medium mb-1">Top</h6>
                          <ul className="text-sm space-y-1">
                            {trendsData.related_topics[keyword].top.slice(0, 5).map((topic: any) => (
                              <li key={topic.topic_title}>
                                {topic.topic_title} ({topic.value})
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h6 className="text-sm font-medium mb-1">Rising</h6>
                          <ul className="text-sm space-y-1">
                            {trendsData.related_topics[keyword].rising.slice(0, 5).map((topic: any) => (
                              <li key={topic.topic_title}>
                                {topic.topic_title} ({topic.value}%)
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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