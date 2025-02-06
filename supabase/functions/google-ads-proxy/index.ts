
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

    try {
      // First, get the list of accessible customers using GET method
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

      const loginResponseText = await loginCustomerResponse.text();
      console.log("Login Customer Response:", {
        status: loginCustomerResponse.status,
        statusText: loginCustomerResponse.statusText,
        headers: Object.fromEntries(loginCustomerResponse.headers.entries()),
        body: loginResponseText,
      });

      if (!loginCustomerResponse.ok) {
        throw new Error(`Failed to get accessible customers: ${loginResponseText}`);
      }

      const { resourceNames } = JSON.parse(loginResponseText);
      
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
      const searchResponse = await fetch(
        `https://googleads.googleapis.com/v15/customers/${loginCustomerId}/googleAds:searchStream`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'login-customer-id': loginCustomerId,
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

      const searchResponseText = await searchResponse.text();
      console.log("Search Response:", {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        headers: Object.fromEntries(searchResponse.headers.entries()),
        body: searchResponseText,
      });

      if (!searchResponse.ok) {
        throw new Error(`Failed to search customer accounts: ${searchResponseText}`);
      }

      let data;
      try {
        data = JSON.parse(searchResponseText);
      } catch (e) {
        console.error("Failed to parse search response:", e);
        throw new Error('Invalid response from Google Ads API');
      }

      console.log("Parsed Search Response:", data);

      if (!data.results) {
        console.warn("No accounts found in search response");
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
    } catch (apiError: any) {
      console.error("Google Ads API Error:", apiError);
      // Return a more specific error status based on the API response
      const status = apiError.status || 400;
      return new Response(
        JSON.stringify({ 
          error: apiError.message,
          details: apiError.toString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status,
        }
      );
    }
  } catch (error: any) {
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

