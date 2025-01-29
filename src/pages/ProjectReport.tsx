import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GrowthChannelTabs } from "@/components/GrowthChannelTabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisReport {
  id: string;
  created_at: string;
  ga4_property: string;
  gsc_property: string | null;
  weekly_analysis: any;
  monthly_analysis: any;
  quarterly_analysis: any;
  ytd_analysis: any;
  last28_yoy_analysis: any;
  yoy_analysis: any;
  status: string;
  user_id: string | null;
  project_id: string | null;
}

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
      return data as AnalysisReport;
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

  const formattedReport = report ? {
    report: {
      weekly_analysis: report.weekly_analysis,
      monthly_analysis: report.monthly_analysis,
      quarterly_analysis: report.quarterly_analysis,
      ytd_analysis: report.ytd_analysis || null,
      last28_yoy_analysis: report.last28_yoy_analysis || null,
      insights: null
    }
  } : null;

  return (
    <div className="space-y-6">
      <GrowthChannelTabs 
        defaultTab="growth" 
        analysisData={formattedReport}
      />
    </div>
  );
};

export default ProjectReport;