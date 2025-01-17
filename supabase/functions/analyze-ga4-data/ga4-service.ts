export async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
  console.log(`Fetching GA4 data for property ${propertyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log('Using event metric:', mainConversionGoal || 'Total Events');
  
  const cleanPropertyId = propertyId.replace(/^properties\//, '');
  console.log('Clean property ID:', cleanPropertyId);
  
  try {
    // First request: Get session data
    const sessionResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`,
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
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
          ],
          metrics: [
            { name: 'sessions' },
          ],
        }),
      }
    );

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('GA4 Session API Error Response:', errorText);
      throw new Error(`GA4 API error: ${sessionResponse.status} ${sessionResponse.statusText} - ${errorText}`);
    }

    const sessionData = await sessionResponse.json();
    console.log('GA4 Session API Response:', sessionData);

    // Second request: Get event data
    const eventResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`,
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
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'eventName' },
          ],
          metrics: [
            { name: 'eventCount' },
            { name: 'totalRevenue' },
          ],
        }),
      }
    );

    if (!eventResponse.ok) {
      const errorText = await eventResponse.text();
      console.error('GA4 Event API Error Response:', errorText);
      throw new Error(`GA4 API error: ${eventResponse.status} ${eventResponse.statusText} - ${errorText}`);
    }

    const eventData = await eventResponse.json();
    console.log('GA4 Event API Response:', eventData);

    // Combine the data
    const combinedData = {
      ...eventData,
      sessionData: sessionData,
      conversionGoal: mainConversionGoal || 'Total Events',
    };

    return combinedData;
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    throw error;
  }
}

export function extractOrganicMetrics(data: any) {
  if (!data || !data.rows || !data.rows.length) {
    console.log('No GA4 data rows found');
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0,
    };
  }

  // Calculate organic sessions from session data
  const organicSessions = data.sessionData?.rows?.reduce((total: number, row: any) => {
    const source = row.dimensionValues?.[0]?.value?.toLowerCase();
    const medium = row.dimensionValues?.[1]?.value?.toLowerCase();
    
    // Check if it's organic search traffic
    if (medium === 'organic' || source === 'google' || source === 'bing' || source === 'yahoo') {
      return total + Number(row.metricValues?.[0]?.value || 0);
    }
    return total;
  }, 0) || 0;

  console.log('Organic sessions calculated:', organicSessions);

  // Filter for organic search traffic in event data
  const organicRows = data.rows.filter((row: any) => {
    const source = row.dimensionValues?.[0]?.value?.toLowerCase();
    const medium = row.dimensionValues?.[1]?.value?.toLowerCase();
    return medium === 'organic' || source === 'google' || source === 'bing' || source === 'yahoo';
  });

  console.log('Organic event rows:', organicRows);

  // Calculate conversions based on the specific event or total events
  const conversions = sumMetricForEvent(organicRows, 0, data.conversionGoal);
  
  // Calculate revenue
  const revenue = organicRows.reduce((total: number, row: any) => {
    return total + Number(row.metricValues[1].value || 0);
  }, 0);

  const metrics = {
    sessions: organicSessions,
    conversions,
    revenue,
  };

  console.log('Extracted GA4 metrics:', metrics);
  return metrics;
}

function sumMetricForEvent(rows: any[], metricIndex: number, eventName: string) {
  if (!eventName || eventName === 'Total Events') {
    return rows.reduce((sum: number, row: any) => {
      const value = row.metricValues?.[metricIndex]?.value;
      return sum + (Number(value) || 0);
    }, 0);
  }
  
  // Filter rows for the specific event and sum its count
  return rows.reduce((sum: number, row: any) => {
    if (row.dimensionValues?.[2]?.value === eventName) {
      const value = row.metricValues?.[metricIndex]?.value;
      return sum + (Number(value) || 0);
    }
    return sum;
  }, 0);
}