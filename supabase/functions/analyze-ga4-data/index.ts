import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ga4Property, gscProperty, accessToken, mainConversionGoal } = await req.json();
    console.log('Analyzing data for:', { ga4Property, gscProperty, mainConversionGoal });

    if (!ga4Property || !accessToken) {
      throw new Error('Missing required parameters: ga4Property or accessToken');
    }

    // Initialize dates for different time periods
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(lastWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch GA4 data
    try {
      const weeklyData = await fetchGA4Data(ga4Property, accessToken, lastWeekStart, now, mainConversionGoal);
      const prevWeekData = await fetchGA4Data(ga4Property, accessToken, prevWeekStart, lastWeekStart, mainConversionGoal);

      // Analyze the data
      const analysis = {
        weekly: analyzeTimePeriod(weeklyData, prevWeekData, 'week'),
      };

      // Store the analysis in Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: report, error: insertError } = await supabase
        .from('analytics_reports')
        .insert({
          ga4_property: ga4Property,
          gsc_property: gscProperty,
          weekly_analysis: analysis.weekly,
          status: 'completed'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting report:', insertError);
        throw insertError;
      }

      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in data fetching or analysis:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in analyze-ga4-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
  const baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
  const url = `${baseUrl}/${propertyId}/runReport`;

  console.log(`Fetching GA4 data from ${startDate} to ${endDate}`);

  const metrics = [
    { name: 'sessions' },
    { name: mainConversionGoal || 'conversions' },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('GA4 API Error Response:', errorData);
    throw new Error(`GA4 API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('GA4 API Response:', data);
  return data;
}

function analyzeTimePeriod(currentData: any, previousData: any, period: string) {
  const organic = {
    current: extractOrganicMetrics(currentData),
    previous: extractOrganicMetrics(previousData),
  };

  const changes = {
    sessions: calculatePercentageChange(
      organic.current.sessions,
      organic.previous.sessions
    ),
    conversions: calculatePercentageChange(
      organic.current.conversions,
      organic.previous.conversions
    ),
  };

  return {
    period,
    current: organic.current,
    previous: organic.previous,
    changes,
    summary: generateSummary(changes, period),
  };
}

function extractOrganicMetrics(data: any) {
  if (!data || !data.rows) {
    console.warn('No data available for metric extraction');
    return { sessions: 0, conversions: 0 };
  }

  const organicTraffic = data.rows.filter(
    (row: any) => 
      row.dimensionValues?.[0]?.value === 'google' && 
      row.dimensionValues?.[1]?.value === 'organic'
  ) || [];

  return {
    sessions: sumMetric(organicTraffic, 0),
    conversions: sumMetric(organicTraffic, 1),
  };
}

function sumMetric(rows: any[], metricIndex: number) {
  return rows.reduce((sum: number, row: any) => {
    const value = row.metricValues?.[metricIndex]?.value;
    return sum + (Number(value) || 0);
  }, 0);
}

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function generateSummary(changes: any, period: string) {
  const trends = Object.entries(changes).map(([metric, change]) => {
    const direction = change >= 0 ? 'increased' : 'decreased';
    return `${metric} has ${direction} by ${Math.abs(change).toFixed(1)}% compared to the previous ${period}`;
  });

  return trends.join('. ');
}