import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { analyzeGA4Data } from "./ga4-service.ts";
import { analyzeGSCData } from "./gsc-service.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ga4Property, gscProperty, accessToken, mainConversionGoal } = await req.json();
    console.log("Analyzing data for:", { ga4Property, gscProperty, mainConversionGoal });

    if (!ga4Property || !accessToken) {
      throw new Error("Missing required parameters");
    }

    const [ga4Analysis, gscAnalysis] = await Promise.all([
      analyzeGA4Data(ga4Property, accessToken, mainConversionGoal),
      gscProperty ? analyzeGSCData(gscProperty, accessToken) : null
    ]);

    // Extract domain from GSC property URL if available
    const domain = gscProperty ? new URL(gscProperty).hostname : undefined;
    console.log("Extracted domain:", domain);

    // Combine analyses and include domain
    const combinedAnalyses = {
      weekly_analysis: { ...ga4Analysis.weekly_analysis, ...(gscAnalysis?.weekly_analysis || {}), domain },
      monthly_analysis: { ...ga4Analysis.monthly_analysis, ...(gscAnalysis?.monthly_analysis || {}), domain },
      quarterly_analysis: { ...ga4Analysis.quarterly_analysis, ...(gscAnalysis?.quarterly_analysis || {}), domain },
      ytd_analysis: { ...ga4Analysis.ytd_analysis, ...(gscAnalysis?.ytd_analysis || {}), domain },
      last28_yoy_analysis: { ...ga4Analysis.last28_yoy_analysis, ...(gscAnalysis?.last28_yoy_analysis || {}), domain }
    };

    console.log("Analysis completed successfully");

    return new Response(
      JSON.stringify({ report: combinedAnalyses }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-ga4-data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});