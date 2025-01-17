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

    // Calculate date ranges for last 28 days and previous 28 days
    const now = new Date();
    const last28DaysEnd = new Date(now);
    const last28DaysStart = new Date(now);
    last28DaysStart.setDate(last28DaysStart.getDate() - 28);
    
    const prev28DaysEnd = new Date(last28DaysStart);
    prev28DaysEnd.setDate(prev28DaysEnd.getDate() - 1);
    const prev28DaysStart = new Date(prev28DaysEnd);
    prev28DaysStart.setDate(prev28DaysStart.getDate() - 28);

    console.log('Date ranges:', {
      current: {
        start: last28DaysStart.toISOString(),
        end: last28DaysEnd.toISOString()
      },
      previous: {
        start: prev28DaysStart.toISOString(),
        end: prev28DaysEnd.toISOString()
      }
    });

    try {
      // Fetch GA4 data
      console.log('Fetching GA4 data...');
      const monthlyGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, last28DaysStart, last28DaysEnd, mainConversionGoal);
      const prevMonthGA4Data = await fetchGA4Data(cleanPropertyId, accessToken, prev28DaysStart, prev28DaysEnd, mainConversionGoal);

      // Fetch GSC data if property is provided
      let monthlyGSCData = null;
      let prevMonthGSCData = null;

      if (gscProperty) {
        console.log('Fetching Search Console data...');
        monthlyGSCData = await fetchGSCData(gscProperty, accessToken, last28DaysStart, last28DaysEnd);
        prevMonthGSCData = await fetchGSCData(gscProperty, accessToken, prev28DaysStart, prev28DaysEnd);
      }

      const analysis = {
        monthly_analysis: analyzeTimePeriod(monthlyGA4Data, prevMonthGA4Data, monthlyGSCData, prevMonthGSCData, 'month'),
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
    console.log(`Fetching GSC data for ${siteUrl} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
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
          rowLimit: 25000, // Increased to get more complete data
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GSC API Error Response:', errorText);
      throw new Error(`GSC API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('GSC API Response:', data);
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

  console.log('Analyzed data:', organic);

  const changes = calculateChanges(organic.current, organic.previous);
  console.log('Calculated changes:', changes);
  
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
  if (!data || !data.rows || !data.rows.length) {
    console.log('No GSC data rows found');
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

  // Calculate averages for CTR and position
  const rowCount = data.rows.length;
  totals.ctr = (totals.clicks / totals.impressions) * 100;
  totals.position = totals.position / rowCount;

  console.log('Extracted GSC metrics:', totals);
  return {
    ...totals,
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
  const periodText = 'Month over Month (Last 28 Days vs Previous 28 Days)';
  
  let summary = `${periodText} Organic Performance Analysis:\n\n`;
  
  // GA4 Metrics
  if (current.source === 'GA4') {
    summary += `Traffic and Engagement:\n`;
    summary += `Organic sessions ${formatChange(changes.sessions, true)} from ${previous.sessions.toLocaleString()} to ${current.sessions.toLocaleString()}. `;
    
    if (current.conversions > 0) {
      const conversionType = current.conversionGoal || 'Total Conversions';
      summary += `\n\nConversions:\nOrganic ${conversionType} ${formatChange(changes.conversions, true)} from ${previous.conversions.toLocaleString()} to ${current.conversions.toLocaleString()}. `;
    }
    
    if (current.revenue > 0) {
      summary += `\n\nRevenue:\nOrganic revenue ${formatChange(changes.revenue, true)} from $${previous.revenue.toLocaleString()} to $${current.revenue.toLocaleString()}. `;
    }
  }
  
  // GSC Metrics
  if (current.source === 'GSC') {
    summary += `\n\nSearch Console Performance:\n`;
    summary += `Organic clicks ${formatChange(changes.clicks, true)} from ${previous.clicks.toLocaleString()} to ${current.clicks.toLocaleString()}. `;
    summary += `Impressions ${formatChange(changes.impressions, true)} from ${previous.impressions.toLocaleString()} to ${current.impressions.toLocaleString()}. `;
    
    if (current.ctr !== undefined) {
      summary += `The click-through rate (CTR) ${formatChange(changes.ctr, true)} to ${current.ctr.toFixed(1)}%. `;
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