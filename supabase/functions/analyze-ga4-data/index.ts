import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    try {
      // Fetch weekly data
      console.log('Fetching weekly data...');
      const weeklyData = await fetchGA4Data(ga4Property, accessToken, lastWeekStart, now, mainConversionGoal);
      console.log('Weekly data fetched successfully');
      
      const prevWeekData = await fetchGA4Data(ga4Property, accessToken, prevWeekStart, lastWeekStart, mainConversionGoal);
      console.log('Previous week data fetched successfully');

      // Fetch monthly data
      console.log('Fetching monthly data...');
      const monthlyData = await fetchGA4Data(ga4Property, accessToken, lastMonthStart, now, mainConversionGoal);
      const prevMonthData = await fetchGA4Data(ga4Property, accessToken, prevMonthStart, lastMonthStart, mainConversionGoal);
      console.log('Monthly data fetched successfully');

      // Analyze the data
      const analysis = {
        weekly_analysis: analyzeTimePeriod(weeklyData, prevWeekData, 'week'),
        monthly_analysis: analyzeTimePeriod(monthlyData, prevMonthData, 'month'),
        quarterly_analysis: null, // To be implemented
        yoy_analysis: null, // To be implemented
      };

      return new Response(JSON.stringify({ report: analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error in data fetching or analysis:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred during data analysis',
        details: error instanceof Error ? error.stack : undefined,
        status: 'error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error) {
    console.error('Error in analyze-ga4-data function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
      status: 'error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
  // Clean up the property ID by removing any trailing slashes and ensuring proper format
  const cleanPropertyId = propertyId.replace(/\/$/, '').replace('properties/', '');
  const baseUrl = 'https://analyticsdata.googleapis.com/v1beta';
  const url = `${baseUrl}/properties/${cleanPropertyId}/runReport`;

  console.log(`Fetching GA4 data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log('Request URL:', url);

  const metrics = [
    { name: 'sessions' },
    { name: mainConversionGoal || 'conversions' },
    { name: 'totalRevenue' }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
      const errorText = await response.text();
      console.error('GA4 API Error Response:', errorText);
      throw new Error(`GA4 API error: ${response.statusText || 'Unknown error'} - ${errorText}`);
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