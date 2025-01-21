import { Button } from "@/components/ui/button";
import { GoogleConnect } from "@/components/GoogleConnect";
import { Summary } from "@/components/Summary";
import { useState } from "react";
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
    <div className="min-h-screen bg-[#1F1B24] text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <img
            src="/lovable-uploads/9c71d2a3-dd26-49a6-876d-e5803d486037.png"
            alt="Standup Notez Logo"
            className="w-64 md:w-80 h-auto"
          />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Transform Your Daily Standups
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl">
            Streamline your daily standups with intelligent note-taking and analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <GoogleConnect />
            <Button variant="outline" className="text-white border-white hover:bg-white/10">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
            <h3 className="text-xl font-semibold mb-4">Smart Notes</h3>
            <p className="text-gray-300">
              Automatically capture and organize your standup notes with AI-powered assistance
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
            <h3 className="text-xl font-semibold mb-4">Team Analytics</h3>
            <p className="text-gray-300">
              Get insights into your team's progress and identify patterns in your standups
            </p>
          </div>
          <div className="p-6 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
            <h3 className="text-xl font-semibold mb-4">Easy Integration</h3>
            <p className="text-gray-300">
              Seamlessly integrate with your existing tools and workflow
            </p>
          </div>
        </div>
      </div>

      {/* Summary Section (keeping existing functionality) */}
      <div className="container mx-auto px-4 py-16">
        <Summary summary={summary} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;
