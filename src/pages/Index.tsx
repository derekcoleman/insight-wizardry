import { useState } from "react";
import { Summary } from "@/components/Summary";
import { GoogleConnect } from "@/components/GoogleConnect";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <img
                src="/logo.webp"
                alt="Standup Notez Logo"
                className="h-8 w-auto"
              />
            </div>
            <div className="flex space-x-4">
              <Button variant="ghost">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Streamline Your</span>
              <span className="block text-blue-600">Daily Standups</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Effortlessly manage and track your team's daily standups with AI-powered insights and summaries.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button size="lg">Start Free Trial</Button>
              <Button variant="outline" size="lg">Learn More</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">AI-Powered Summaries</h3>
              <p className="mt-2 text-gray-600">Get instant, intelligent summaries of your standup meetings.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Team Analytics</h3>
              <p className="mt-2 text-gray-600">Track progress and identify patterns in your team's updates.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Easy Integration</h3>
              <p className="mt-2 text-gray-600">Seamlessly connects with your existing tools and workflows.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <GoogleConnect />
        <Summary summary={summary} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Index;