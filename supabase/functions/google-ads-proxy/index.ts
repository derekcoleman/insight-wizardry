
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
    const body = await req.text();
    console.log("Received request body:", body);
    
    let accessToken;
    try {
      const data = JSON.parse(body);
      accessToken = data.accessToken;
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body",
          details: "Request body must be valid JSON with an accessToken field"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    
    console.log("Request validation:", {
      hasAccessToken: !!accessToken,
      hasDeveloperToken: !!developerToken,
      accessTokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : null,
      developerTokenPrefix: developerToken ? developerToken.substring(0, 10) + '...' : null,
    });

    if (!developerToken) {
      console.error("Developer token not found in environment");
      return new Response(
        JSON.stringify({ 
          error: 'Developer token not configured',
          details: 'The Google Ads Developer Token is not set in the environment'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!accessToken) {
      console.error("Access token not provided in request");
      return new Response(
        JSON.stringify({ 
          error: 'Access token is required',
          details: 'No access token was provided in the request body'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log("Fetching Google Ads accounts...");

    try {
      // First, get the list of accessible customers
      const loginCustomerResponse = await fetch(
        'https://googleads.googleapis.com/v15/customers/search',
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
                customer.id,
                customer.descriptive_name
              FROM customer
              WHERE customer.status = "ENABLED"
            `,
          }),
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
        return new Response(
          JSON.stringify({ 
            error: `Failed to get accessible customers: ${loginCustomerResponse.statusText}`,
            details: loginResponseText
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: loginCustomerResponse.status,
          }
        );
      }

      let data;
      try {
        data = JSON.parse(loginResponseText);
      } catch (e) {
        console.error("Failed to parse login response:", e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid API response',
            details: 'Failed to parse the Google Ads API response'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log("Parsed Response:", data);

      if (!data.results) {
        console.warn("No accounts found in response");
        return new Response(
          JSON.stringify({ accounts: [] }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      const accounts = data.results.map((result: any) => ({
        id: result.customer.id,
        name: result.customer.descriptiveName || `Account ${result.customer.id}`,
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
      return new Response(
        JSON.stringify({ 
          error: apiError.message || 'Google Ads API error',
          details: apiError.toString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: apiError.status || 500,
        }
      );
    }
  } catch (error: any) {
    console.error('Error in google-ads-proxy function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
