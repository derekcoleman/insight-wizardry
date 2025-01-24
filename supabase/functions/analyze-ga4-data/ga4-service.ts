import { fetchGA4Data } from './ga4-service.ts';
import { extractOrganicMetrics } from './ga4-service.ts';
import { extractGSCMetrics } from './gsc-service.ts';

const formatEventName = (eventName: string): string => {
  if (eventName === 'Total Events') return eventName;
  return eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
  console.log(`Fetching GA4 data for property ${propertyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log('Using event metric:', mainConversionGoal || 'Total Events');
  
  const cleanPropertyId = propertyId.replace(/^properties\//, '');
  console.log('Clean property ID:', cleanPropertyId);
  
  try {
    // First request: Get session data using sessionDefaultChannelGrouping
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
            { name: 'sessionDefaultChannelGrouping' }
          ],
          metrics: [
            { name: 'sessions' }
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

    // Second request: Get page path and conversion data
    const pageConversionResponse = await fetch(
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
            { name: 'sessionDefaultChannelGrouping' },
            { name: 'pagePath' },
          ],
          metrics: [
            { name: mainConversionGoal || 'totalUsers' },
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'sessionConversionRate' },
          ],
        }),
      }
    );

    if (!pageConversionResponse.ok) {
      const errorText = await pageConversionResponse.text();
      console.error('GA4 Page Conversion API Error Response:', errorText);
      throw new Error(`GA4 API error: ${pageConversionResponse.status} ${pageConversionResponse.statusText} - ${errorText}`);
    }

    const pageConversionData = await pageConversionResponse.json();
    console.log('GA4 Page Conversion API Response:', pageConversionData);

    // Third request: Get journey-based conversion data
    const journeyConversionResponse = await fetch(
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
            { name: 'sessionDefaultChannelGrouping' },
            { name: 'pagePath' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'conversions' },
            { name: 'sessionConversionRate' },
          ],
          dimensionFilter: {
            filter: {
              fieldName: mainConversionGoal || 'conversions',
              numericFilter: {
                operation: 'GREATER_THAN',
                value: { int64Value: '0' },
              },
            },
          },
        }),
      }
    );

    if (!journeyConversionResponse.ok) {
      console.warn('Journey conversion data not available:', await journeyConversionResponse.text());
      return {
        sessionData,
        pageConversionData,
        conversionGoal: mainConversionGoal || 'Total Events',
      };
    }

    const journeyConversionData = await journeyConversionResponse.json();
    console.log('GA4 Journey Conversion API Response:', journeyConversionData);

    return {
      sessionData,
      pageConversionData,
      journeyConversionData,
      conversionGoal: mainConversionGoal || 'Total Events',
    };
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    throw error;
  }
}

export function extractOrganicMetrics(data: any) {
  if (!data || !data.sessionData?.rows || !data.sessionData.rows.length) {
    console.log('No GA4 session data rows found');
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0,
      products: {
        current: [],
        previous: [],
      },
    };
  }

  // Calculate organic sessions from session data using default channel grouping
  const organicSessions = data.sessionData.rows.reduce((total: number, row: any) => {
    const channelGrouping = row.dimensionValues?.[0]?.value?.toLowerCase();
    
    // Check if it's organic search traffic from default channel grouping
    if (channelGrouping === 'organic search') {
      return total + Number(row.metricValues?.[0]?.value || 0);
    }
    return total;
  }, 0) || 0;

  console.log('Organic sessions calculated:', organicSessions);

  // Filter for organic search traffic in event data using sessionDefaultChannelGrouping
  const organicRows = data.rows?.filter((row: any) => {
    const channelGrouping = row.dimensionValues?.[0]?.value?.toLowerCase();
    return channelGrouping === 'organic search';
  }) || [];

  console.log('Organic event rows:', organicRows);

  // Calculate conversions based on the specific event or total events
  const conversions = sumMetricForEvent(organicRows, 0, data.conversionGoal);
  
  // Calculate revenue
  const revenue = organicRows.reduce((total: number, row: any) => {
    return total + Number(row.metricValues?.[1]?.value || 0);
  }, 0);

  // Extract current period product data
  const currentProducts = data.productData
    ?.filter((row: any) => row.dimensionValues?.[0]?.value?.toLowerCase() === 'organic search')
    ?.map((row: any) => ({
      name: row.dimensionValues?.[1]?.value || 'Unknown Product',
      id: row.dimensionValues?.[2]?.value || '',
      views: Number(row.metricValues?.[0]?.value || 0),
      purchases: Number(row.metricValues?.[1]?.value || 0),
      revenue: Number(row.metricValues?.[2]?.value || 0),
    })) || [];

  // Extract previous period product data if available
  const previousProducts = data.previousPeriodProductData
    ?.filter((row: any) => row.dimensionValues?.[0]?.value?.toLowerCase() === 'organic search')
    ?.map((row: any) => ({
      name: row.dimensionValues?.[1]?.value || 'Unknown Product',
      id: row.dimensionValues?.[2]?.value || '',
      views: Number(row.metricValues?.[0]?.value || 0),
      purchases: Number(row.metricValues?.[1]?.value || 0),
      revenue: Number(row.metricValues?.[2]?.value || 0),
    })) || [];

  const metrics = {
    sessions: organicSessions,
    conversions,
    revenue,
    products: {
      current: currentProducts,
      previous: previousProducts,
    },
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
    if (row.dimensionValues?.[1]?.value === eventName) {
      const value = row.metricValues?.[metricIndex]?.value;
      return sum + (Number(value) || 0);
    }
    return sum;
  }, 0);
}
