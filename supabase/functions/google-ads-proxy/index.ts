import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json();
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    
    if (!developerToken) {
      throw new Error('Developer token not configured');
    }

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    console.log("Fetching Google Ads accounts...");
    
    // Updated URL to use v15 of the API
    const adsResponse = await fetch(
      "https://googleads.googleapis.com/v15/customers/listAccessibleCustomers",
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'login-customer-id': '-', // Required for first-time access
        },
      }
    );

    if (!adsResponse.ok) {
      const errorData = await adsResponse.text();
      console.error("Google Ads API Error Response:", errorData);
      throw new Error(`Google Ads API error: ${adsResponse.statusText}`);
    }

    const adsData = await adsResponse.json();
    console.log("Google Ads Response:", adsData);

    // Format account data
    const accounts = await Promise.all(
      adsData.resourceNames.map(async (resourceName: string) => {
        const customerId = resourceName.split('/')[1];
        try {
          const accountResponse = await fetch(
            `https://googleads.googleapis.com/v15/customers/${customerId}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
              },
            }
          );
          
          if (!accountResponse.ok) {
            console.warn(`Failed to fetch details for account ${customerId}`);
            return {
              id: customerId,
              name: `Account ${customerId}`,
            };
          }

          const accountData = await accountResponse.json();
          return {
            id: customerId,
            name: accountData.customer?.descriptiveName || `Account ${customerId}`,
          };
        } catch (error) {
          console.warn(`Error fetching details for account ${customerId}:`, error);
          return {
            id: customerId,
            name: `Account ${customerId}`,
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ accounts }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in google-ads-proxy function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});