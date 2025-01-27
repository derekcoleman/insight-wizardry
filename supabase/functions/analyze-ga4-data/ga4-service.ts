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
        { name: 'conversions' },
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

    // Second request: Get event data with sessionDefaultChannelGrouping
    console.log('Fetching event data...');
    const eventRequestBody = {
      dateRanges: [{
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }],
      dimensions: [
        { name: 'sessionDefaultChannelGrouping' },
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'conversions' },
        { name: 'totalRevenue' }
      ],
    };

    console.log('Event request body:', JSON.stringify(eventRequestBody, null, 2));

    const eventResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventRequestBody),
      }
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error('GA4 Event API Error Response:', errorText);
      console.error('Response status:', eventResponse.status);
      console.error('Response headers:', Object.fromEntries(eventResponse.headers.entries()));
      throw new Error(`GA4 API error: ${eventResponse.status} ${eventResponse.statusText} - ${errorText}`);
    }

    const eventData = await eventResponse.json();
    console.log('GA4 Event API Response:', JSON.stringify(eventData, null, 2));

    // Process and validate the data
    if (!sessionData.rows || sessionData.rows.length === 0) {
      console.warn('No session data returned from GA4');
    }

    if (!eventData.rows || eventData.rows.length === 0) {
      console.warn('No event data returned from GA4');
    }

    // Return processed data with channel grouping
    const processedData = {
      sessionData,
      rows: eventData.rows || [],
      conversionGoal: mainConversionGoal || 'Total Events',
      channelGroupings: processChannelData(sessionData)
    };

    console.log('Processed GA4 data:', JSON.stringify(processedData, null, 2));
    return processedData;

  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

function processChannelData(sessionData: any) {
  if (!sessionData.rows) {
    console.warn('No rows in session data to process channel groupings');
    return {};
  }

  const channelData: Record<string, any> = {};
  
  sessionData.rows.forEach((row: any) => {
    const channel = row.dimensionValues?.[0]?.value;
    if (channel) {
      channelData[channel.toLowerCase()] = {
        sessions: Number(row.metricValues?.[0]?.value || 0),
        conversions: Number(row.metricValues?.[1]?.value || 0),
        revenue: Number(row.metricValues?.[2]?.value || 0)
      };
    }
  });

  console.log('Processed channel data:', channelData);
  return channelData;
}

export function extractOrganicMetrics(data: any) {
  console.log('Extracting organic metrics from data:', data);

  if (!data || !data.sessionData?.rows) {
    console.warn('No GA4 session data rows found');
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0
    };
  }

  const channelData = data.channelGroupings || {};
  const organicData = channelData['organic search'] || {
    sessions: 0,
    conversions: 0,
    revenue: 0
  };

  console.log('Extracted organic metrics:', organicData);
  return organicData;
}

export function extractChannelMetrics(data: any, channelName: string) {
  console.log(`Extracting metrics for channel: ${channelName}`);
  console.log('Data:', data);

  if (!data || !data.sessionData?.rows) {
    console.warn(`No GA4 session data rows found for channel: ${channelName}`);
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0
    };
  }

  const channelData = data.channelGroupings || {};
  const metrics = channelData[channelName.toLowerCase()] || {
    sessions: 0,
    conversions: 0,
    revenue: 0
  };

  console.log(`Extracted metrics for ${channelName}:`, metrics);
  return metrics;
}