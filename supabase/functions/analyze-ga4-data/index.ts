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

    const now = new Date();
    const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(lastWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    try {
      // Fetch GA4 data
      console.log('Fetching GA4 data...');
      const weeklyGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, lastWeekStart, now, mainConversionGoal);
      const prevWeekGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, prevWeekStart, lastWeekStart, mainConversionGoal);
      const monthlyGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, lastMonthStart, now, mainConversionGoal);
      const prevMonthGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, prevMonthStart, lastMonthStart, mainConversionGoal);

      // Fetch GSC data if property is provided
      let weeklyGSCData = null;
      let prevWeekGSCData = null;
      let monthlyGSCData = null;
      let prevMonthGSCData = null;

      if (gscProperty) {
        console.log('Fetching Search Console data...');
        weeklyGSCData = await fetchGSCData(gscProperty, accessToken, lastWeekStart, now);
        prevWeekGSCData = await fetchGSCData(gscProperty, accessToken, prevWeekStart, lastWeekStart);
        monthlyGSCData = await fetchGSCData(gscProperty, accessToken, lastMonthStart, now);
        prevMonthGSCData = await fetchGSCData(gscProperty, accessToken, prevMonthStart, lastMonthStart);
      }

      const analysis = {
        weekly_analysis: analyzeTimePeriod(weeklyGA4Data, prevWeekGA4Data, weeklyGSCData, prevWeekGSCData, 'week'),
        monthly_analysis: analyzeTimePeriod(monthlyGA4Data, prevMonthGA4Data, monthlyGSCData, prevMonthGSCData, 'month'),
        quarterly_analysis: null,
        yoy_analysis: null,
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
  console.log(`Fetching GA4 data for property ${propertyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log('Using conversion goal:', mainConversionGoal || 'default conversions');
  
  try {
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
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
          dimensionFilter: {
            andGroup: {
              expressions: [
                {
                  filter: {
                    fieldName: "sessionSource",
                    stringFilter: {
                      value: "google",
                      matchType: "EXACT"
                    }
                  }
                },
                {
                  filter: {
                    fieldName: "sessionMedium",
                    stringFilter: {
                      value: "organic",
                      matchType: "EXACT"
                    }
                  }
                }
              ]
            }
          },
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: mainConversionGoal || 'conversions' },
            { name: 'totalRevenue' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GA4 API Error Response:', errorText);
      throw new Error(`GA4 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('GA4 API Response:', data);
    
    // Add conversion goal name to the response
    data.conversionGoal = mainConversionGoal || 'Total Conversions';
    return data;
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    throw error;
  }
}

async function fetchGSCData(siteUrl: string, accessToken: string, startDate: Date, endDate: Date) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query'],
          rowLimit: 25,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching GSC data:', error);
    throw error;
  }
}

function analyzeTimePeriod(currentGA4Data: any, previousGA4Data: any, currentGSCData: any, previousGSCData: any, period: string) {
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

  const changes = calculateChanges(organic.current, organic.previous);
  
  return {
    period,
    current: organic.current,
    previous: organic.previous,
    changes,
    summary: generateDetailedSummary(changes, organic.current, organic.previous, period),
    dataSources: {
      ga4: Boolean(currentGA4Data),
      gsc: Boolean(currentGSCData),
    },
  };
}

function extractOrganicMetrics(data: any) {
  if (!data || !data.rows) {
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0,
      averageOrderValue: 0,
      bounceRate: 0,
      engagedSessions: 0,
      pageviews: 0,
      avgSessionDuration: 0,
      source: 'GA4',
    };
  }

  const organicTraffic = data.rows.filter(
    (row: any) => 
      row.dimensionValues?.[0]?.value === 'google' && 
      row.dimensionValues?.[1]?.value === 'organic'
  ) || [];

  const metrics = {
    sessions: sumMetric(organicTraffic, 0),
    conversions: sumMetric(organicTraffic, 1),
    revenue: sumMetric(organicTraffic, 2),
    averageOrderValue: sumMetric(organicTraffic, 3),
    bounceRate: sumMetric(organicTraffic, 4),
    engagedSessions: sumMetric(organicTraffic, 5),
    pageviews: sumMetric(organicTraffic, 6),
    avgSessionDuration: sumMetric(organicTraffic, 7),
    source: 'GA4',
  };

  return metrics;
}

function extractGSCMetrics(data: any) {
  if (!data || !data.rows) {
    return {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
      source: 'GSC',
    };
  }

  const totals = data.rows.reduce(
    (acc: any, row: any) => ({
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
      ctr: acc.ctr + (row.ctr || 0),
      position: acc.position + (row.position || 0),
    }),
    { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  );

  return {
    ...totals,
    ctr: totals.ctr / (data.rows.length || 1),
    position: totals.position / (data.rows.length || 1),
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

function generateDetailedSummary(changes: any, current: any, previous: any, period: string) {
  const periodText = period === 'week' ? 'Week over Week (WoW)' : 'Month over Month (MoM)';
  
  let summary = `${periodText} Performance Analysis:\n\n`;
  
  // GA4 Metrics
  if (current.source === 'GA4') {
    summary += `Traffic and Engagement (GA4):\n`;
    summary += `Organic sessions ${formatChange(changes.sessions, true)} from ${previous.sessions.toLocaleString()} to ${current.sessions.toLocaleString()}. `;
    
    if (current.engagedSessions > 0) {
      summary += `Engaged sessions ${formatChange(changes.engagedSessions, true)} to ${current.engagedSessions.toLocaleString()}. `;
    }
    
    if (current.bounceRate !== undefined) {
      summary += `The bounce rate ${formatChange(changes.bounceRate, false)} to ${current.bounceRate.toFixed(1)}%. `;
    }
    
    summary += `\n\nConversions and Revenue (GA4):\n`;
    if (current.conversions > 0) {
      summary += `Organic conversions ${formatChange(changes.conversions, true)} from ${previous.conversions.toLocaleString()} to ${current.conversions.toLocaleString()}. `;
    }
    
    if (current.revenue > 0) {
      summary += `Organic revenue ${formatChange(changes.revenue, true)} from $${previous.revenue.toLocaleString()} to $${current.revenue.toLocaleString()}. `;
      
      if (current.averageOrderValue > 0) {
        summary += `The average order value (AOV) ${formatChange(changes.averageOrderValue, true)} from $${previous.averageOrderValue.toLocaleString()} to $${current.averageOrderValue.toLocaleString()}. `;
      }
    }
  }
  
  // GSC Metrics
  if (current.source === 'GSC') {
    summary += `\n\nSearch Visibility (Search Console):\n`;
    summary += `Organic clicks ${formatChange(changes.clicks, true)} from ${previous.clicks.toLocaleString()} to ${current.clicks.toLocaleString()}. `;
    summary += `Impressions ${formatChange(changes.impressions, true)} from ${previous.impressions.toLocaleString()} to ${current.impressions.toLocaleString()}. `;
    
    if (current.ctr !== undefined) {
      summary += `The click-through rate (CTR) ${formatChange(changes.ctr, true)} to ${(current.ctr * 100).toFixed(1)}%. `;
    }
    
    if (current.position !== undefined) {
      summary += `The average position ${formatChange(changes.position, false)} to ${current.position.toFixed(1)}. `;
    }
  }

  return summary;
}

function formatChange(change: number, higherIsBetter: boolean = true) {
  if (!change) return "remained stable";
  
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