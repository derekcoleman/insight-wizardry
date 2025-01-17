export async function fetchGA4Data(propertyId: string, accessToken: string, startDate: Date, endDate: Date, mainConversionGoal?: string) {
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
          dimensions: [
            { name: 'sessionDefaultChannelGroup' },
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

export function extractOrganicMetrics(data: any) {
  if (!data || !data.rows || !data.rows.length) {
    console.log('No GA4 data rows found');
    return {
      sessions: 0,
      conversions: 0,
      revenue: 0,
      source: 'GA4',
    };
  }

  // Filter for organic search from the default channel grouping
  const organicRows = data.rows.filter((row: any) => 
    row.dimensionValues?.[0]?.value === 'Organic Search'
  );

  const metrics = {
    sessions: sumMetric(organicRows, 0),
    conversions: sumMetric(organicRows, 1),
    revenue: sumMetric(organicRows, 2),
    source: 'GA4',
  };

  console.log('Extracted GA4 metrics:', metrics);
  return metrics;
}

function sumMetric(rows: any[], metricIndex: number) {
  return rows.reduce((sum: number, row: any) => {
    const value = row.metricValues?.[metricIndex]?.value;
    return sum + (Number(value) || 0);
  }, 0);
}