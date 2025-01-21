import { useState } from "react";
import { Summary } from "@/components/Summary";
import { GoogleConnect } from "@/components/GoogleConnect";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async (data: string) => {
    setIsLoading(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('generate-summary', {
        body: { data }
      });

      if (error) throw error;

      setSummary(response.summary);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Analytics Summary Generator</h1>
          <p className="text-muted-foreground">
            Transform your Google Analytics and Search Console data into concise, insightful summaries
          </p>
        </div>
        <GoogleConnect />
        <Summary summary={summary} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;