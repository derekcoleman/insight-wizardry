import { Button } from "@/components/ui/button";
import { GoogleConnect } from "@/components/GoogleConnect";
import { Summary } from "@/components/Summary";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { removeBackground, loadImage } from "@/utils/imageUtils";

const Index = () => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const processLogo = async () => {
      try {
        const response = await fetch("/lovable-uploads/9c71d2a3-dd26-49a6-876d-e5803d486037.png");
        const blob = await response.blob();
        const img = await loadImage(blob);
        const processedBlob = await removeBackground(img);
        const url = URL.createObjectURL(processedBlob);
        setProcessedLogo(url);
      } catch (error) {
        console.error("Error processing logo:", error);
        // Fallback to original logo if processing fails
        setProcessedLogo("/lovable-uploads/9c71d2a3-dd26-49a6-876d-e5803d486037.png");
      }
    };
    processLogo();
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          {processedLogo && (
            <img
              src={processedLogo}
              alt="Standup Notez Logo"
              className="w-64 md:w-80 h-auto"
            />
          )}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
            Transform Your Daily Standups
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl">
            Streamline your daily standups with intelligent note-taking and analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <GoogleConnect />
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 bg-white">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-xl shadow-sm bg-white border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Smart Notes</h3>
            <p className="text-gray-600">
              Automatically capture and organize your standup notes with AI-powered assistance
            </p>
          </div>
          <div className="p-8 rounded-xl shadow-sm bg-white border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Team Analytics</h3>
            <p className="text-gray-600">
              Get insights into your team's progress and identify patterns in your standups
            </p>
          </div>
          <div className="p-8 rounded-xl shadow-sm bg-white border border-gray-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Easy Integration</h3>
            <p className="text-gray-600">
              Seamlessly integrate with your existing tools and workflow
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="container mx-auto px-4 py-16 bg-gray-50">
        <Summary summary={summary} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;