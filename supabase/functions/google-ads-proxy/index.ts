
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken } = await req.json();
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    
    console.log("Starting Google Ads proxy request with:", {
      hasAccessToken: !!accessToken,
      hasDeveloperToken: !!developerToken,
      accessTokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : null,
      developerTokenPrefix: developerToken ? developerToken.substring(0, 10) + '...' : null,
    });

    if (!developerToken) {
      console.error("Developer token not found in environment");
      throw new Error('Developer token not configured');
    }

    if (!accessToken) {
      console.error("Access token not provided in request");
      throw new Error('Access token is required');
    }

    console.log("Fetching Google Ads accounts...");

    // First, get the login customer ID
    const loginCustomerResponse = await fetch(
      'https://googleads.googleapis.com/v15/customers:listAccessibleCustomers',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        },
      }
    );

    if (!loginCustomerResponse.ok) {
      const errorText = await loginCustomerResponse.text();
      console.error("Failed to get login customer ID:", errorText);
      throw new Error(`Failed to get login customer ID: ${errorText}`);
    }

    const { resourceNames } = await loginCustomerResponse.json();
    
    if (!resourceNames || resourceNames.length === 0) {
      console.warn("No accessible customers found");
      return new Response(
        JSON.stringify({ accounts: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Extract the first customer ID to use for searching
    const loginCustomerId = resourceNames[0].split('/')[1];
    console.log("Using login customer ID:", loginCustomerId);

    // Now use searchStream with the login customer ID
    const response = await fetch(
      `https://googleads.googleapis.com/v15/customers/${loginCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            SELECT
              customer_client.descriptive_name,
              customer_client.id
            FROM customer_client
            WHERE customer_client.status = "ENABLED"
          `
        }),
      }
    );

    const responseText = await response.text();
    console.log("Google Ads API Response:", responseText);

    if (!response.ok) {
      console.error("Google Ads API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });
      throw new Error(`Google Ads API error (${response.status}): ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Google Ads API response:", e);
      throw new Error('Invalid response from Google Ads API');
    }

    console.log("Parsed Google Ads API Response:", data);

    if (!data.results) {
      console.warn("No accounts found in Google Ads API response");
      return new Response(
        JSON.stringify({ accounts: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const accounts = data.results.map((result: any) => ({
      id: result.customerClient.id,
      name: result.customerClient.descriptiveName || `Account ${result.customerClient.id}`,
    }));

    console.log("Returning accounts:", accounts);

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
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
