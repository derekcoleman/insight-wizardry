
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Function to handle API calls to Google APIs
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const token = req.headers.get('Authorization');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle GA4 account list request
    if (path === '/api/proxy/ga4/accounts') {
      const response = await fetch(
        'https://analyticsadmin.googleapis.com/v1alpha/accounts',
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle GA4 properties request for an account
    if (path === '/api/proxy/ga4/properties') {
      const accountId = url.searchParams.get('accountId');
      
      if (!accountId) {
        return new Response(
          JSON.stringify({ error: 'Missing accountId parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const response = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${accountId}`,
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle GA4 events request for a property
    if (path === '/api/proxy/ga4/events') {
      const propertyId = url.searchParams.get('propertyId');
      
      if (!propertyId) {
        return new Response(
          JSON.stringify({ error: 'Missing propertyId parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{
              startDate: '30daysAgo',
              endDate: 'today',
            }],
            dimensions: [
              { name: 'eventName' },
            ],
            metrics: [
              { name: 'eventCount' },
            ],
          }),
        }
      );
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle Search Console sites request
    if (path === '/api/proxy/gsc/sites') {
      const response = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ data }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // If no matching endpoint
    return new Response(
      JSON.stringify({ error: 'Unknown API endpoint' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
})
