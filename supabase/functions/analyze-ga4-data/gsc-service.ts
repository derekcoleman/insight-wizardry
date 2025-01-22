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
    throw new Error(`GSC API error for pages: ${pagesResponse.statusText}`);
  }

  const overallData = await overallResponse.json();
  const pagesData = await pagesResponse.json();

  return {
    ...extractGSCMetrics(overallData),
    pages: pagesData.rows || [],
  };
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