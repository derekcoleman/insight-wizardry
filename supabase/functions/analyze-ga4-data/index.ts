import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ga4Property, gscProperty, accessToken, mainConversionGoal } = await req.json();
    console.log('Analyzing data for:', { ga4Property, gscProperty, mainConversionGoal });

    if (!ga4Property || !accessToken) {
      throw new Error('Missing required parameters');
    }

    // Initialize dates for different time periods
    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(lastWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const lastQuarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const prevQuarterStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const prevYearStart = new Date(now.getFullYear() - 2, now.getMonth(), 1);

    // Fetch GA4 data for each time period
    try {
      const weeklyData = await fetchGA4Data(ga4Property, accessToken, lastWeekStart, now, mainConversionGoal);
      const prevWeekData = await fetchGA4Data(ga4Property, accessToken, prevWeekStart, lastWeekStart, mainConversionGoal);
      const monthlyData = await fetchGA4Data(ga4Property, accessToken, lastMonthStart, now, mainConversionGoal);
      const prevMonthData = await fetchGA4Data(ga4Property, accessToken, prevMonthStart, lastMonthStart, mainConversionGoal);
      const quarterlyData = await fetchGA4Data(ga4Property, accessToken, lastQuarterStart, now, mainConversionGoal);
      const prevQuarterData = await fetchGA4Data(ga4Property, accessToken, prevQuarterStart, lastQuarterStart, mainConversionGoal);
      const yearlyData = await fetchGA4Data(ga4Property, accessToken, lastYearStart, now, mainConversionGoal);
      const prevYearData = await fetchGA4Data(ga4Property, accessToken, prevYearStart, lastYearStart, mainConversionGoal);

      // Analyze the data
      const analysis = {
        weekly: analyzeTimePeriod(weeklyData, prevWeekData, 'week'),
        monthly: analyzeTimePeriod(monthlyData, prevMonthData, 'month'),
        quarterly: analyzeTimePeriod(quarterlyData, prevQuarterData, 'quarter'),
        yearly: analyzeTimePeriod(yearlyData, prevYearData, 'year'),
      };

      // Store the analysis in Supabase
      const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: report, error: insertError } = await supabase
        .from('analytics_reports')
        .insert({
          ga4_property: ga4Property,
          gsc_property: gscProperty,
          weekly_analysis: analysis.weekly,
          monthly_analysis: analysis.monthly,
          quarterly_analysis: analysis.quarterly,
          yoy_analysis: analysis.yearly,
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
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
  try {
    const baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
    const url = `${baseUrl}/${propertyId}/runReport`;

    console.log(`Fetching GA4 data from ${url}`);

    const metrics = [
      { name: 'sessions' },
      { name: mainConversionGoal || 'conversions' },
      { name: 'totalRevenue' },
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
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    throw error;
  }
}

function analyzeTimePeriod(currentData: any, previousData: any, period: string) {
  try {
    // Extract organic traffic metrics
    const organic = {
      current: extractOrganicMetrics(currentData),
      previous: extractOrganicMetrics(previousData),
    };

    // Calculate changes
    const changes = {
      sessions: calculatePercentageChange(
        organic.current.sessions,
        organic.previous.sessions
      ),
      conversions: calculatePercentageChange(
        organic.current.conversions,
        organic.previous.conversions
      ),
      revenue: calculatePercentageChange(
        organic.current.revenue,
        organic.previous.revenue
      ),
    };

    return {
      period,
      current: organic.current,
      previous: organic.previous,
      changes,
      summary: generateSummary(changes, period),
    };
  } catch (error) {
    console.error(`Error analyzing ${period} data:`, error);
    throw error;
  }
}

function extractOrganicMetrics(data: any) {
  if (!data || !data.rows) {
    console.warn('No data available for metric extraction');
    return { sessions: 0, conversions: 0, revenue: 0 };
  }

  const organicTraffic = data.rows.filter(
    (row: any) => 
      row.dimensionValues?.[0]?.value === 'google' && 
      row.dimensionValues?.[1]?.value === 'organic'
  ) || [];

  return {
    sessions: sumMetric(organicTraffic, 0),
    conversions: sumMetric(organicTraffic, 1),
    revenue: sumMetric(organicTraffic, 2),
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