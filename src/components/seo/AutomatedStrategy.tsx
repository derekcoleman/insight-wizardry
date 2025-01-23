import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentTopicCard } from "./ContentTopicCard";
import { KeywordGapAnalysis } from "./KeywordGapAnalysis";

interface ContentTopic {
  title: string;
  description: string;
  targetKeywords: string[];
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

export function AutomatedStrategy() {
  const [isLoading, setIsLoading] = useState(false);
  const [contentTopics, setContentTopics] = useState<ContentTopic[]>([]);
  const { toast } = useToast();

  const generateStrategy = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('generate-seo-strategy', {
        body: {}
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.topics) {
        throw new Error('No topics generated');
      }

      setContentTopics(response.data.topics);
      toast({
        title: "Strategy Generated",
        description: "Your SEO content strategy has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating strategy:', error);
      toast({
        title: "Error",
        description: "Failed to generate SEO strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Content Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Generate content recommendations based on AI analysis.
          </p>
          <Button 
            onClick={generateStrategy} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Strategy
          </Button>
        </CardContent>
      </Card>

      <KeywordGapAnalysis />

      {contentTopics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contentTopics.map((topic, index) => (
            <ContentTopicCard key={index} topic={topic} />
          ))}
        </div>
      )}
    </div>
  );
}