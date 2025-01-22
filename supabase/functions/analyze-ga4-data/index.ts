import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { analyzeGA4Data } from "./ga4-service.ts";
import { analyzeGSCData } from "./gsc-service.ts";

serve(async (req) => {
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
    const combinedAnalyses = ['weekly', 'monthly', 'quarterly', 'ytd', 'last28_yoy'].reduce((acc, period) => {
      const analysis = {
        ...ga4Analysis[`${period}_analysis`],
        ...(gscAnalysis ? gscAnalysis[`${period}_analysis`] : {}),
        domain // Add domain to each analysis period
      };
      acc[`${period}_analysis`] = analysis;
      return acc;
    }, {});

    console.log("Analysis completed successfully");

    return new Response(
      JSON.stringify({ 
        report: combinedAnalyses
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in analyze-ga4-data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});