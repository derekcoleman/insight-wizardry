export async function fetchGSCData(siteUrl: string, accessToken: string, startDate: Date, endDate: Date) {
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
          dimensions: [],
          rowLimit: 1,
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

    if (!data.rows || data.rows.length === 0) {
      console.log('No GSC data found for the period');
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0
      };
    }

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

export async function fetchGSCSearchTerms(
  siteUrl: string, 
  accessToken: string, 
  currentStartDate: Date, 
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
) {
  try {
    console.log('Fetching GSC search terms data...');
    
    const [currentResponse, previousResponse] = await Promise.all([
      fetch(
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
      ),
      fetch(
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
            rowLimit: 50,
            aggregationType: 'auto'
          }),
        }
      )
    ]);

    if (!currentResponse.ok || !previousResponse.ok) {
      throw new Error(`GSC API error: ${currentResponse.status} or ${previousResponse.status}`);
    }

    const [currentData, previousData] = await Promise.all([
      currentResponse.json(),
      previousResponse.json()
    ]);

    if (!currentData.rows || currentData.rows.length === 0) {
      console.log('No search terms data found for current period');
      return [];
    }

    const previousTermsMap = new Map(
      previousData.rows?.map((row: any) => [row.keys[0], row]) || []
    );

    return currentData.rows.map((currentRow: any) => {
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
  } catch (error) {
    console.error('Error fetching GSC search terms:', error);
    throw error;
  }
}

export function extractGSCMetrics(data: any) {
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