import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GrowthChannelTabs } from "@/components/GrowthChannelTabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ProjectReport = () => {
  const { projectId } = useParams();

  const { data: report, isLoading } = useQuery({
    queryKey: ["project-report", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Card>
          <Skeleton className="h-[400px]" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GrowthChannelTabs 
        defaultTab="growth" 
        analysisData={report ? { report } : null} 
      />
    </div>
  );
};

export default ProjectReport;