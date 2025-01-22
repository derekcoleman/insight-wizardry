export async function fetchGSCData(propertyId: string, startDate: string, endDate: string, accessToken: string) {
  const url = 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(propertyId) + '/searchAnalytics/query';
  
  // Fetch overall metrics
  const overallResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: [],
    }),
  });

  if (!overallResponse.ok) {
    console.error('GSC API Error:', await overallResponse.text());
    throw new Error(`GSC API error: ${overallResponse.statusText}`);
  }

  // Fetch pages data
  const pagesResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 100,
    }),
  });

  if (!pagesResponse.ok) {
    console.error('GSC API Error for pages:', await pagesResponse.text());
    throw new Error(`GSC API error for pages: ${pagesResponse.statusText}`);
  }

  const overallData = await overallResponse.json();
  const pagesData = await pagesResponse.json();

  return {
    ...extractGSCMetrics(overallData),
    pages: pagesData.rows || [],
  };
}

export async function fetchGSCSearchTerms(
  propertyId: string, 
  accessToken: string, 
  currentStartDate: Date, 
  currentEndDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
) {
  const url = 'https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(propertyId) + '/searchAnalytics/query';
  
  // Fetch current period search terms
  const currentResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: currentStartDate.toISOString().split('T')[0],
      endDate: currentEndDate.toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: 20,
    }),
  });

  if (!currentResponse.ok) {
    console.error('GSC API Error for search terms:', await currentResponse.text());
    throw new Error(`GSC API error for search terms: ${currentResponse.statusText}`);
  }

  // Fetch previous period search terms
  const previousResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: previousStartDate.toISOString().split('T')[0],
      endDate: previousEndDate.toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: 20,
    }),
  });

  if (!previousResponse.ok) {
    console.error('GSC API Error for previous search terms:', await previousResponse.text());
    throw new Error(`GSC API error for previous search terms: ${previousResponse.statusText}`);
  }

  const currentData = await currentResponse.json();
  const previousData = await previousResponse.json();

  // Map and combine the data
  const searchTerms = (currentData.rows || []).map((row: any) => {
    const previousTerm = (previousData.rows || []).find((prev: any) => prev.keys[0] === row.keys[0]);
    
    return {
      term: row.keys[0],
      current: {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: (row.ctr * 100).toFixed(2),
        position: row.position.toFixed(1)
      },
      previous: previousTerm ? {
        clicks: previousTerm.clicks,
        impressions: previousTerm.impressions,
        ctr: (previousTerm.ctr * 100).toFixed(2),
        position: previousTerm.position.toFixed(1)
      } : {
        clicks: 0,
        impressions: 0,
        ctr: '0',
        position: '0'
      },
      changes: {
        clicks: calculatePercentageChange(row.clicks, previousTerm?.clicks || 0).toFixed(1),
        impressions: calculatePercentageChange(row.impressions, previousTerm?.impressions || 0).toFixed(1),
        ctr: calculatePercentageChange(row.ctr, previousTerm?.ctr || 0).toFixed(1),
        position: calculatePercentageChange(row.position, previousTerm?.position || 0).toFixed(1)
      }
    };
  });

  return searchTerms;
}

export function extractGSCMetrics(data: any) {
  if (!data || !data.rows || data.rows.length === 0) {
    return {
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };
  }

  const row = data.rows[0];
  return {
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  };
}

function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}