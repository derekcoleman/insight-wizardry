import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { GoogleConnect } from "@/components/GoogleConnect";

const Index = () => {
  const navigate = useNavigate();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  useEffect(() => {
    if (session) {
      navigate('/projects');
    }
  }, [session, navigate]);

  if (session) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Growth Analytics</span>
              <span className="block text-blue-600">& Strategy Platform</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Connect your Google account to analyze and optimize your digital marketing performance across all channels.
            </p>
          </div>
          
          <Card className="max-w-xl mx-auto p-6">
            <GoogleConnect />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;