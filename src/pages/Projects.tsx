import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectList } from "@/components/ProjectList";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (session === null) {
      navigate('/auth');
    }
  }, [session, navigate]);

  // Check for Google OAuth data
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('google_oauth_data')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    meta: {
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to fetch profile data",
          variant: "destructive",
        });
      }
    }
  });

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProjectList />
        </div>
      </div>
    </div>
  );
};

export default Projects;