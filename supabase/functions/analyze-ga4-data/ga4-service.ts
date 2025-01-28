import { corsHeaders } from "./cors.ts";

export async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
  console.log(`Fetching GA4 data for property ${propertyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log('Using event metric:', mainConversionGoal || 'Total Events');
  
  const cleanPropertyId = propertyId.replace(/^properties\//, '');
  console.log('Clean property ID:', cleanPropertyId);
  
  try {
    // First request: Get session data using sessionDefaultChannelGrouping
    console.log('Fetching session data...');
    const sessionRequestBody = {
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }],
      dimensions: [
        { name: 'sessionDefaultChannelGrouping' }
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'activeUsers' },
        { name: mainConversionGoal ? 'eventCount' : 'conversions' },
        { name: 'totalRevenue' }
      ],
    };
    
    console.log('Session request body:', JSON.stringify(sessionRequestBody, null, 2));
    
    const sessionResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionRequestBody),
      }
    );

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('GA4 Session API Error Response:', errorText);
      console.error('Response status:', sessionResponse.status);
      console.error('Response headers:', Object.fromEntries(sessionResponse.headers.entries()));
      throw new Error(`GA4 API error: ${sessionResponse.status} ${sessionResponse.statusText} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('GA4 Session API Response:', JSON.stringify(sessionData, null, 2));

    // Process and validate the data
    if (!sessionData.rows || sessionData.rows.length === 0) {
      console.warn('No session data returned from GA4');
      return {
        sessionData: { rows: [] },
        rows: [],
        conversionGoal: mainConversionGoal || 'Total Events',
        channelGroupings: {}
      };
    }

    // Process channel data
    const channelData = processChannelData(sessionData, mainConversionGoal);
    console.log('Processed channel data:', channelData);

    return {
      sessionData,
      rows: [],
      conversionGoal: mainConversionGoal || 'Total Events',
      channelGroupings: channelData
    };

  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : '');
    throw error;
  }
}

function processChannelData(sessionData: any, mainConversionGoal?: string) {
  if (!sessionData.rows) {
    console.warn('No rows in session data to process channel groupings');
    return {};
  }

  const channelData: Record<string, any> = {};
  const channelMappings: Record<string, string> = {
    'Organic Search': 'organic_search',
    'Paid Search': 'paid_search',
    'CPC': 'paid_search',
    'Google Ads': 'paid_search',
    'Pmax': 'paid_search',
    'Paid Social': 'paid_social',
    'Organic Social': 'organic_social',
    'Email': 'email',
    'Direct': 'direct',
    'Referral': 'referral',
    'Display': 'display',
    'Affiliates': 'affiliates',
    'Video': 'video'
  };
  
  let totalActiveUsers = 0;
  
  sessionData.rows.forEach((row: any) => {
    const channel = row.dimensionValues?.[0]?.value;
    if (channel) {
      const normalizedChannel = channelMappings[channel] || channel.toLowerCase().replace(/\s+/g, '_');
      
      // Add metrics to channel data
      if (!channelData[normalizedChannel]) {
        channelData[normalizedChannel] = {
          sessions: 0,
          activeUsers: 0,
          conversions: 0,
          revenue: 0
        };
      }
      
      const activeUsers = Number(row.metricValues?.[1]?.value || 0);
      totalActiveUsers += activeUsers;
      
      channelData[normalizedChannel] = {
        sessions: channelData[normalizedChannel].sessions + Number(row.metricValues?.[0]?.value || 0),
        activeUsers: channelData[normalizedChannel].activeUsers + activeUsers,
        conversions: channelData[normalizedChannel].conversions + Number(row.metricValues?.[2]?.value || 0),
        revenue: channelData[normalizedChannel].revenue + Number(row.metricValues?.[3]?.value || 0)
      };
      
      console.log(`Processed channel ${channel} (${normalizedChannel}):`, channelData[normalizedChannel]);
    }
  });

  // Calculate totals
  const totals = {
    sessions: 0,
    activeUsers: totalActiveUsers, // Use the sum we calculated
    conversions: 0,
    revenue: 0
  };

  Object.values(channelData).forEach((data: any) => {
    totals.sessions += data.sessions;
    totals.conversions += data.conversions;
    totals.revenue += data.revenue;
  });

  channelData.total = totals;
  console.log('Channel data with totals:', channelData);
  return channelData;
}

export function extractChannelMetrics(data: any, channelName: string) {
  console.log(`Extracting metrics for channel: ${channelName}`);
  console.log('Data:', data);

  if (!data?.channelGroupings) {
    console.warn(`No channel groupings found for: ${channelName}`);
    return {
      sessions: 0,
      activeUsers: 0,
      conversions: 0,
      revenue: 0
    };
  }

  const normalizedChannelName = channelName.toLowerCase().replace(/\s+/g, '_');
  const metrics = data.channelGroupings[normalizedChannelName] || {
    sessions: 0,
    activeUsers: 0,
    conversions: 0,
    revenue: 0
  };

  console.log(`Extracted metrics for ${channelName}:`, metrics);
  return metrics;
}

export function extractTotalMetrics(data: any) {
  console.log('Extracting total metrics');
  console.log('Data:', data);

  if (!data?.channelGroupings?.total) {
    console.warn('No total metrics found');
    return {
      sessions: 0,
      activeUsers: 0,
      conversions: 0,
      revenue: 0
    };
  }

  const metrics = data.channelGroupings.total;
  console.log('Extracted total metrics:', metrics);
  return metrics;
}