import { useState } from "react";
import { DataInput } from "@/components/DataInput";
import { Summary } from "@/components/Summary";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { GoogleConnect } from "@/components/GoogleConnect";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async (data: string) => {
    const apiKey = localStorage.getItem("OPENAI_API_KEY");
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter your OpenAI API key first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a professional analytics expert. Create a concise, well-structured summary of the provided Google Analytics and Search Console data. Focus on key metrics, trends, and actionable insights.",
            },
            {
              role: "user",
              content: data,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const result = await response.json();
      setSummary(result.choices[0].message.content);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please check your API key and try again.",
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
        <ApiKeyInput />
        <GoogleConnect />
        <DataInput onSubmit={generateSummary} />
        <Summary summary={summary} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;