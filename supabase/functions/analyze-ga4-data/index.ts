import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: ga4Property or accessToken',
          status: 'error'
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const cleanPropertyId = ga4Property.replace(/^properties\//, '').replace(/\/$/, '');
    console.log('Clean property ID:', cleanPropertyId);

    // Calculate date ranges - excluding today for more accurate comparisons
    const now = new Date();
    
    // Last 7 days (yesterday to 7 days ago)
    const last7DaysEnd = new Date(now);
    last7DaysEnd.setDate(last7DaysEnd.getDate() - 1); // End yesterday
    const last7DaysStart = new Date(last7DaysEnd);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6); // Start 7 days before yesterday
    
    // Previous 7 days
    const prev7DaysEnd = new Date(last7DaysStart);
    prev7DaysEnd.setDate(prev7DaysEnd.getDate() - 1);
    const prev7DaysStart = new Date(prev7DaysEnd);
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 6);

    // Last 28 days (yesterday to 28 days ago)
    const last28DaysEnd = new Date(now);
    last28DaysEnd.setDate(last28DaysEnd.getDate() - 1); // End yesterday
    const last28DaysStart = new Date(last28DaysEnd);
    last28DaysStart.setDate(last28DaysStart.getDate() - 27); // Start 28 days before yesterday
    
    // Previous 28 days
    const prev28DaysEnd = new Date(last28DaysStart);
    prev28DaysEnd.setDate(prev28DaysEnd.getDate() - 1);
    const prev28DaysStart = new Date(prev28DaysEnd);
    prev28DaysStart.setDate(prev28DaysStart.getDate() - 27);

    console.log('Date ranges:', {
      weekly: {
        current: {
          start: last7DaysStart.toISOString().split('T')[0],
          end: last7DaysEnd.toISOString().split('T')[0]
        },
        previous: {
          start: prev7DaysStart.toISOString().split('T')[0],
          end: prev7DaysEnd.toISOString().split('T')[0]
        }
      },
      monthly: {
        current: {
          start: last28DaysStart.toISOString().split('T')[0],
          end: last28DaysEnd.toISOString().split('T')[0]
        },
        previous: {
          start: prev28DaysStart.toISOString().split('T')[0],
          end: prev28DaysEnd.toISOString().split('T')[0]
        }
      }
    });

    function formatDateRange(start: Date, end: Date, previous: { start: Date; end: Date }) {
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      };
      
      return `${formatDate(start)} - ${formatDate(end)} vs ${formatDate(previous.start)} - ${formatDate(previous.end)}`;
    }

    function analyzeTimePeriod(currentGA4Data: any, previousGA4Data: any, currentGSCData: any, previousGSCData: any, period: string, currentDateRange: { start: Date; end: Date }, previousDateRange: { start: Date; end: Date }) {
      const organic = {
        current: {
          ...extractOrganicMetrics(currentGA4Data),
          ...(currentGSCData ? extractGSCMetrics(currentGSCData) : {}),
          conversionGoal: currentGA4Data?.conversionGoal || 'Total Conversions',
        },
        previous: {
          ...extractOrganicMetrics(previousGA4Data),
          ...(previousGSCData ? extractGSCMetrics(previousGSCData) : {}),
          conversionGoal: previousGA4Data?.conversionGoal || 'Total Conversions',
        },
      };

      console.log('Analyzed data:', organic);

      const changes = calculateChanges(organic.current, organic.previous);
      console.log('Calculated changes:', changes);

      const dateRangeText = formatDateRange(
        currentDateRange.start,
        currentDateRange.end,
        previousDateRange
      );
      
      return {
        period: dateRangeText,
        current: organic.current,
        previous: organic.previous,
        changes,
        summary: generateDetailedSummary(changes, organic.current, organic.previous, dateRangeText),
        dataSources: {
          ga4: Boolean(currentGA4Data),
          gsc: Boolean(currentGSCData),
        },
      };
    }

    try {
      // Fetch GA4 data
      console.log('Fetching GA4 data...');
      const weeklyGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, last7DaysStart, last7DaysEnd, mainConversionGoal);
      const prevWeekGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, prev7DaysStart, prev7DaysEnd, mainConversionGoal);
      const monthlyGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, last28DaysStart, last28DaysEnd, mainConversionGoal);
      const prevMonthGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, prev28DaysStart, prev28DaysEnd, mainConversionGoal);

      // Fetch GSC data if property is provided
      let weeklyGSCData = null;
      let prevWeekGSCData = null;
      let monthlyGSCData = null;
      let prevMonthGSCData = null;
      let weeklySearchTerms = null;
      let monthlySearchTerms = null;

      if (gscProperty) {
        console.log('Fetching Search Console data...');
        
        // Fetch total metrics
        weeklyGSCData = await fetchGSCData(gscProperty, accessToken, last7DaysStart, last7DaysEnd);
        prevWeekGSCData = await fetchGSCData(gscProperty, accessToken, prev7DaysStart, prev7DaysEnd);
        monthlyGSCData = await fetchGSCData(gscProperty, accessToken, last28DaysStart, last28DaysEnd);
        prevMonthGSCData = await fetchGSCData(gscProperty, accessToken, prev28DaysStart, prev28DaysEnd);

        // Fetch search terms data
        weeklySearchTerms = await fetchGSCSearchTerms(
          gscProperty, 
          accessToken, 
          last7DaysStart, 
          last7DaysEnd,
          prev7DaysStart,
          prev7DaysEnd
        );
        
        monthlySearchTerms = await fetchGSCSearchTerms(
          gscProperty, 
          accessToken, 
          last28DaysStart, 
          last28DaysEnd,
          prev28DaysStart,
          prev28DaysEnd
        );
      }

      const analysis = {
        weekly_analysis: {
          ...analyzeTimePeriod(
            weeklyGA4Data, 
            prevWeekGA4Data, 
            weeklyGSCData, 
            prevWeekGSCData, 
            'week',
            { start: last7DaysStart, end: last7DaysEnd },
            { start: prev7DaysStart, end: prev7DaysEnd }
          ),
          searchTerms: weeklySearchTerms
        },
        monthly_analysis: {
          ...analyzeTimePeriod(
            monthlyGA4Data, 
            prevMonthGA4Data, 
            monthlyGSCData, 
            prevMonthGSCData, 
            'month',
            { start: last28DaysStart, end: last28DaysEnd },
            { start: prev28DaysStart, end: prev28DaysEnd }
          ),
          searchTerms: monthlySearchTerms
        }
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

function extractOrganicMetrics(data: any) {
  if (!data || !data.rows || !data.rows.length) {
    console.log('No GA4 data rows found');
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0,
      source: 'GA4',
    };
  }

  const metrics = {
    sessions: sumMetric(data.rows, 0),
    conversions: sumMetric(data.rows, 1),
    revenue: sumMetric(data.rows, 2),
    source: 'GA4',
  };

  console.log('Extracted GA4 metrics:', metrics);
  return metrics;
}

function extractGSCMetrics(data: any) {
  if (!data) {
    console.log('No GSC data provided');
    return {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      source: 'GSC',
    };
  }

  console.log('Extracting GSC metrics from:', data);

  return {
    clicks: Math.round(data.clicks || 0),
    impressions: Math.round(data.impressions || 0),
    ctr: data.ctr || 0,
    position: data.position || 0,
    source: 'GSC',
  };
}

function calculateChanges(current: any, previous: any) {
  const changes: any = {};
  
  for (const key in current) {
    if (typeof current[key] === 'number' && typeof previous[key] === 'number') {
      changes[key] = previous[key] === 0 
        ? (current[key] > 0 ? 100 : 0)
        : ((current[key] - previous[key]) / previous[key]) * 100;
    }
  }
  
  return changes;
}

function formatChange(change: number, higherIsBetter: boolean = true) {
  if (!change || isNaN(change)) return "remained stable";
  
  const direction = change > 0 ? "increased" : "decreased";
  const goodBad = higherIsBetter ? 
    (change > 0 ? "improved" : "declined") : 
    (change > 0 ? "declined" : "improved");
  
  return `${direction} by ${Math.abs(change).toFixed(1)}% (${goodBad})`;
}

function sumMetric(rows: any[], metricIndex: number) {
  return rows.reduce((sum: number, row: any) => {
    const value = row.metricValues?.[metricIndex]?.value;
    return sum + (Number(value) || 0);
  }, 0);
}
