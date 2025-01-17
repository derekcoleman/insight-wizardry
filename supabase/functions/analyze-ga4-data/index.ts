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

    // Calculate date ranges
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Last 7 days (ending yesterday)
    const last7DaysEnd = new Date(now);
    last7DaysEnd.setDate(last7DaysEnd.getDate() - 1);
    const last7DaysStart = new Date(last7DaysEnd);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);
    
    // Previous 7 days
    const prev7DaysEnd = new Date(last7DaysStart);
    prev7DaysEnd.setDate(prev7DaysEnd.getDate() - 1);
    const prev7DaysStart = new Date(prev7DaysEnd);
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 6);

    // Last 28 days (ending yesterday)
    const last28DaysEnd = new Date(now);
    last28DaysEnd.setDate(last28DaysEnd.getDate() - 1);
    const last28DaysStart = new Date(last28DaysEnd);
    last28DaysStart.setDate(last28DaysStart.getDate() - 27);
    
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
          ...analyzeTimePeriod(weeklyGA4Data, prevWeekGA4Data, weeklyGSCData, prevWeekGSCData, 'week'),
          searchTerms: weeklySearchTerms
        },
        monthly_analysis: {
          ...analyzeTimePeriod(monthlyGA4Data, prevMonthGA4Data, monthlyGSCData, prevMonthGSCData, 'month'),
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
    console.log(`Fetching GSC data for ${siteUrl} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
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
          type: 'web',
          dimensions: [], // Remove dimensions to get total aggregated data
          rowLimit: 1, // We only need the totals
          aggregationType: 'auto'
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

    // If no data is returned, return zeros but log it
    if (!data.rows || data.rows.length === 0) {
      console.log('No GSC data found for the period');
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0
      };
    }

    // Extract the totals from the first row
    const totals = data.rows[0];
    return {
      clicks: Math.round(totals.clicks || 0),
      impressions: Math.round(totals.impressions || 0),
      ctr: totals.ctr ? (totals.ctr * 100) : 0,
      position: totals.position || 0
    };
  } catch (error) {
    console.error('Error fetching GSC data:', error);
    throw error;
  }
}

async function fetchGSCSearchTerms(
  siteUrl: string, 
  accessToken: string, 
  currentStartDate: Date, 
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
) {
  try {
    console.log('Fetching GSC search terms data...');
    
    // Fetch current period data
    const currentResponse = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: currentStartDate.toISOString().split('T')[0],
          endDate: currentEndDate.toISOString().split('T')[0],
          dimensions: ['query'],
          type: 'web',
          rowLimit: 10,
          aggregationType: 'auto'
        }),
      }
    );

    if (!currentResponse.ok) {
      throw new Error(`GSC API error: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();
    console.log('Current period search terms data:', currentData);
    
    // Fetch previous period data
    const previousResponse = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(siteUrl) + '/searchAnalytics/query',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: previousStartDate.toISOString().split('T')[0],
          endDate: previousEndDate.toISOString().split('T')[0],
          dimensions: ['query'],
          type: 'web',
          rowLimit: 50, // Fetch more to ensure we can match with current terms
          aggregationType: 'auto'
        }),
      }
    );

    if (!previousResponse.ok) {
      throw new Error(`GSC API error: ${previousResponse.status}`);
    }

    const previousData = await previousResponse.json();
    console.log('Previous period search terms data:', previousData);

    // Handle case where no data is returned
    if (!currentData.rows || currentData.rows.length === 0) {
      console.log('No search terms data found for current period');
      return [];
    }

    // Create a map of previous period data for easy lookup
    const previousTermsMap = new Map(
      previousData.rows?.map((row: any) => [row.keys[0], row]) || []
    );

    // Process and combine the data
    const searchTerms = currentData.rows.map((currentRow: any) => {
      const term = currentRow.keys[0];
      const previousRow = previousTermsMap.get(term);
      
      const currentClicks = Math.round(currentRow.clicks || 0);
      const previousClicks = Math.round(previousRow?.clicks || 0);
      const clicksChange = previousClicks === 0 
        ? (currentClicks > 0 ? 100 : 0)
        : ((currentClicks - previousClicks) / previousClicks * 100);

      return {
        term,
        current: {
          clicks: currentClicks,
          impressions: Math.round(currentRow.impressions || 0),
          ctr: (currentRow.ctr * 100).toFixed(1),
          position: currentRow.position.toFixed(1)
        },
        previous: {
          clicks: previousClicks,
          impressions: Math.round(previousRow?.impressions || 0),
          ctr: previousRow ? (previousRow.ctr * 100).toFixed(1) : "0.0",
          position: previousRow ? previousRow.position.toFixed(1) : "0.0"
        },
        changes: {
          clicks: clicksChange.toFixed(1),
          impressions: previousRow ? 
            ((currentRow.impressions - previousRow.impressions) / previousRow.impressions * 100).toFixed(1) : 
            "100.0",
          ctr: previousRow ? 
            ((currentRow.ctr - previousRow.ctr) / previousRow.ctr * 100).toFixed(1) : 
            "100.0",
          position: previousRow ? 
            ((previousRow.position - currentRow.position) / previousRow.position * 100).toFixed(1) : 
            "100.0"
        }
      };
    });

    console.log('Processed search terms data:', searchTerms);
    return searchTerms;

  } catch (error) {
    console.error('Error fetching GSC search terms:', error);
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

function generateDetailedSummary(changes: any, current: any, previous: any, period: string) {
  const periodText = period === 'month' ? 
    'Month over Month (Last 28 Days vs Previous 28 Days)' : 
    'Week over Week (Last 7 Days vs Previous 7 Days)';
  
  let summary = `${periodText} Organic Performance Analysis:\n\n`;
  
  // GA4 Metrics
  if (current.sessions !== undefined) {
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
  if (current.clicks !== undefined) {
    console.log('Adding GSC metrics to summary:', {
      currentClicks: current.clicks,
      previousClicks: previous.clicks,
      currentImpressions: current.impressions,
      previousImpressions: previous.impressions,
      currentCtr: current.ctr,
      previousCtr: previous.ctr,
      currentPosition: current.position,
      previousPosition: previous.position,
    });

    summary += `\n\nSearch Console Performance:\n`;
    summary += `Organic clicks ${formatChange(changes.clicks, true)} from ${Math.round(previous.clicks).toLocaleString()} to ${Math.round(current.clicks).toLocaleString()}. `;
    summary += `Impressions ${formatChange(changes.impressions, true)} from ${Math.round(previous.impressions).toLocaleString()} to ${Math.round(current.impressions).toLocaleString()}. `;
    
    const currentCtr = current.ctr * 100;
    const previousCtr = previous.ctr * 100;
    if (!isNaN(currentCtr) && !isNaN(previousCtr)) {
      summary += `The click-through rate (CTR) ${formatChange(changes.ctr, true)} to ${currentCtr.toFixed(1)}%. `;
    }
    
    if (current.position !== undefined && previous.position !== undefined) {
      summary += `The average position ${formatChange(changes.position, false)} to ${current.position.toFixed(1)}. `;
    }
  }

  return summary;
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
