export function extractGSCMetrics(data: any) {
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

  const metrics = {
    clicks: data.rows.reduce((sum: number, row: any) => sum + (Number(row.clicks) || 0), 0),
    impressions: data.rows.reduce((sum: number, row: any) => sum + (Number(row.impressions) || 0), 0),
    ctr: data.rows.reduce((sum: number, row: any) => sum + (Number(row.ctr) || 0), 0) / data.rows.length,
    position: data.rows.reduce((sum: number, row: any) => sum + (Number(row.position) || 0), 0) / data.rows.length,
    source: 'GSC',
  };

  console.log('Extracted GSC metrics:', metrics);
  return metrics;
}

export async function fetchGSCData(siteUrl: string, accessToken: string, startDate: Date, endDate: Date) {
  console.log(`Fetching GSC data for site ${siteUrl} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
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
          dimensions: [],
          rowLimit: 25000,
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

export async function fetchGSCSearchTerms(
  siteUrl: string,
  accessToken: string,
  currentStartDate: Date,
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
) {
  try {
    const [currentData, previousData] = await Promise.all([
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
            rowLimit: 10,
          }),
        }
      ).then(res => res.json()),
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
            rowLimit: 10,
          }),
        }
      ).then(res => res.json()),
    ]);

    if (!currentData.rows || !previousData.rows) {
      return [];
    }

    const searchTerms = currentData.rows.map((currentRow: any) => {
      const previousRow = previousData.rows.find((row: any) => row.keys[0] === currentRow.keys[0]) || {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };

      const clicksChange = previousRow.clicks === 0
        ? (currentRow.clicks > 0 ? 100 : 0)
        : ((currentRow.clicks - previousRow.clicks) / previousRow.clicks) * 100;

      const impressionsChange = previousRow.impressions === 0
        ? (currentRow.impressions > 0 ? 100 : 0)
        : ((currentRow.impressions - previousRow.impressions) / previousRow.impressions) * 100;

      const ctrChange = previousRow.ctr === 0
        ? (currentRow.ctr > 0 ? 100 : 0)
        : ((currentRow.ctr - previousRow.ctr) / previousRow.ctr) * 100;

      const positionChange = previousRow.position === 0
        ? (currentRow.position > 0 ? 100 : 0)
        : ((previousRow.position - currentRow.position) / previousRow.position) * 100;

      return {
        term: currentRow.keys[0],
        current: {
          clicks: currentRow.clicks,
          impressions: currentRow.impressions,
          ctr: (currentRow.ctr * 100).toFixed(1),
          position: currentRow.position.toFixed(1),
        },
        previous: {
          clicks: previousRow.clicks,
          impressions: previousRow.impressions,
          ctr: (previousRow.ctr * 100).toFixed(1),
          position: previousRow.position.toFixed(1),
        },
        changes: {
          clicks: clicksChange.toFixed(1),
          impressions: impressionsChange.toFixed(1),
          ctr: ctrChange.toFixed(1),
          position: positionChange.toFixed(1),
        },
      };
    });

    return searchTerms;
  } catch (error) {
    console.error('Error fetching GSC search terms:', error);
    return [];
  }
}

export async function fetchGSCPages(
  siteUrl: string,
  accessToken: string,
  currentStartDate: Date,
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
) {
  try {
    const [currentData, previousData] = await Promise.all([
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
            dimensions: ['page'],
            rowLimit: 10,
          }),
        }
      ).then(res => res.json()),
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
            dimensions: ['page'],
            rowLimit: 10,
          }),
        }
      ).then(res => res.json()),
    ]);

    if (!currentData.rows || !previousData.rows) {
      return [];
    }

    const pages = currentData.rows.map((currentRow: any) => {
      const previousRow = previousData.rows.find((row: any) => row.keys[0] === currentRow.keys[0]) || {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };

      const clicksChange = previousRow.clicks === 0
        ? (currentRow.clicks > 0 ? 100 : 0)
        : ((currentRow.clicks - previousRow.clicks) / previousRow.clicks) * 100;

      const impressionsChange = previousRow.impressions === 0
        ? (currentRow.impressions > 0 ? 100 : 0)
        : ((currentRow.impressions - previousRow.impressions) / previousRow.impressions) * 100;

      const ctrChange = previousRow.ctr === 0
        ? (currentRow.ctr > 0 ? 100 : 0)
        : ((currentRow.ctr - previousRow.ctr) / previousRow.ctr) * 100;

      const positionChange = previousRow.position === 0
        ? (currentRow.position > 0 ? 100 : 0)
        : ((previousRow.position - currentRow.position) / previousRow.position) * 100;

      return {
        page: currentRow.keys[0],
        current: {
          clicks: currentRow.clicks,
          impressions: currentRow.impressions,
          ctr: (currentRow.ctr * 100).toFixed(1),
          position: currentRow.position.toFixed(1),
        },
        previous: {
          clicks: previousRow.clicks,
          impressions: previousRow.impressions,
          ctr: (previousRow.ctr * 100).toFixed(1),
          position: previousRow.position.toFixed(1),
        },
        changes: {
          clicks: clicksChange.toFixed(1),
          impressions: impressionsChange.toFixed(1),
          ctr: ctrChange.toFixed(1),
          position: positionChange.toFixed(1),
        },
      };
    });

    return pages;
  } catch (error) {
    console.error('Error fetching GSC pages:', error);
    return [];
  }
}
