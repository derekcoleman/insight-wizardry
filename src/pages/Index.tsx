import { useState } from "react";
import { GrowthChannelTabs } from "@/components/GrowthChannelTabs";
import { GoogleConnect } from "@/components/GoogleConnect";
import { Card } from "@/components/ui/card";
import { ProjectList } from "@/components/ProjectList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AnalysisData {
  report: {
    weekly_analysis: any;
    monthly_analysis: any;
    quarterly_analysis: any;
    ytd_analysis: any;
    last28_yoy_analysis: any;
  } | null;
}

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const handleAnalysisComplete = (data: AnalysisData) => {
    setAnalysisData(data);
    setIsConnected(true);
    navigate('/projects');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {session ? (
            <ProjectList />
          ) : (
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Growth Analytics</span>
                  <span className="block text-blue-600">& Strategy Platform</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                  Connect your Google account to analyze and optimize your digital marketing performance across all channels.
                </p>
              </div>
              
              {!isConnected ? (
                <Card className="max-w-xl mx-auto p-6">
                  <GoogleConnect onAnalysisComplete={handleAnalysisComplete} />
                </Card>
              ) : (
                <div className="mt-10">
                  <GrowthChannelTabs defaultTab="growth" analysisData={analysisData} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;