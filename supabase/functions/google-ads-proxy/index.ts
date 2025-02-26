
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
    // Log the raw request for debugging
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const body = await req.text();
    console.log("Raw request body:", body);
    
    let accessToken;
    try {
      const data = JSON.parse(body);
      accessToken = data.accessToken;
      console.log("Parsed request data:", { hasAccessToken: !!data.accessToken });
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request body",
          details: "Request body must be valid JSON with an accessToken field",
          rawBody: body,
          parseError: e.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    
    // Log validation details
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
      console.log("Making request to Google Ads API...");
      
      // Get list of accessible customers
      const searchResponse = await fetch(
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
                customer.descriptive_name,
                customer.currency_code,
                customer.time_zone
              FROM customer
              WHERE customer.status = "ENABLED"
            `
          })
        }
      );

      // Log the full response for debugging
      const searchResponseText = await searchResponse.text();
      console.log("Google Ads API Response:", {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        headers: Object.fromEntries(searchResponse.headers.entries()),
        body: searchResponseText,
      });

      if (!searchResponse.ok) {
        console.error("Google Ads API error response:", {
          status: searchResponse.status,
          body: searchResponseText
        });
        
        return new Response(
          JSON.stringify({ 
            error: `Failed to get accessible customers: ${searchResponse.statusText}`,
            details: searchResponseText,
            status: searchResponse.status
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: searchResponse.status,
          }
        );
      }

      let data;
      try {
        data = JSON.parse(searchResponseText);
        console.log("Parsed API response:", data);
      } catch (e) {
        console.error("Failed to parse API response:", e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid API response',
            details: 'Failed to parse the Google Ads API response',
            rawResponse: searchResponseText
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      if (!data.results || !Array.isArray(data.results)) {
        console.warn("No accounts found or invalid response format:", data);
        return new Response(
          JSON.stringify({ 
            accounts: [],
            warning: 'No accounts found or invalid response format',
            responseData: data
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Transform the results into the expected format
      const accounts = data.results.map((result: any) => ({
        id: result.customer.id,
        name: result.customer.descriptiveName || `Account ${result.customer.id}`,
      }));

      console.log("Final accounts list:", accounts);

      return new Response(
        JSON.stringify({ accounts }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (apiError: any) {
      console.error("Google Ads API Error:", {
        message: apiError.message,
        stack: apiError.stack,
        details: apiError
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Google Ads API error',
          message: apiError.message,
          details: apiError.toString(),
          stack: apiError.stack
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: apiError.status || 500,
        }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error in google-ads-proxy function:', {
      message: error.message,
      stack: error.stack,
      details: error
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        details: error.toString(),
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
