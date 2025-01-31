import { useEffect } from "react";
import { ProjectList } from "@/components/ProjectList";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Projects = () => {
  const navigate = useNavigate();
  
  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

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