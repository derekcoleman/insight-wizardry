import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GrowthChannelTabs } from "@/components/GrowthChannelTabs";

interface AnalysisReport {
  weekly_analysis: any;
  monthly_analysis: any;
  quarterly_analysis: any;
  ytd_analysis: any;
  last28_yoy_analysis: any;
}

const ProjectReport = () => {
  const { projectId } = useParams();

  const { data: report } = useQuery({
    queryKey: ['report', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) throw error;

      // Format the report data for GrowthChannelTabs
      const formattedReport: AnalysisReport = {
        weekly_analysis: data.weekly_analysis,
        monthly_analysis: data.monthly_analysis,
        quarterly_analysis: data.quarterly_analysis,
        ytd_analysis: data.yoy_analysis, // Map yoy_analysis to ytd_analysis
        last28_yoy_analysis: data.weekly_analysis // Use weekly analysis as last 28 days YoY
      };

      return formattedReport;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <GrowthChannelTabs 
            defaultTab="growth" 
            analysisData={report ? { report } : null} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectReport;