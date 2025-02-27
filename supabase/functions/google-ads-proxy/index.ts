
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

    if (!developerToken) {
      console.error("Developer token not found in environment");
      return new Response(
        JSON.stringify({ 
          error: 'Developer token not configured'
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
          error: 'Access token is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    try {
      // First get the user's email to use as login-customer-id
      const userinfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      if (!userinfoResponse.ok) {
        throw new Error(`Failed to get user info: ${userinfoResponse.statusText}`);
      }

      const userInfo = await userinfoResponse.json();
      console.log("User info received:", { email: userInfo.email });

      // Try to get customer list using Google Ads API v15
      const adsResponse = await fetch(
        'https://googleads.googleapis.com/v15/customers/search',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
              SELECT
                customer.id,
                customer.descriptive_name
              FROM customer
              WHERE customer.status = "ENABLED"
            `
          })
        }
      );

      const responseText = await adsResponse.text();
      console.log("Raw Google Ads API Response:", {
        status: adsResponse.status,
        headers: Object.fromEntries(adsResponse.headers.entries()),
        body: responseText
      });

      if (!adsResponse.ok) {
        throw new Error(`Google Ads API error: ${adsResponse.status} - ${adsResponse.statusText}`);
      }

      const adsData = JSON.parse(responseText);
      console.log("Parsed Google Ads response:", adsData);

      let accounts = [];
      if (adsData.results) {
        accounts = adsData.results.map((result: any) => ({
          id: result.customer?.id || '',
          name: result.customer?.descriptive_name || `Account ${result.customer?.id || 'Unknown'}`
        }));
      }

      console.log("Processed accounts:", accounts);

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
        stack: apiError.stack
      });
      
      // Return an empty accounts array with error information
      return new Response(
        JSON.stringify({ 
          accounts: [],
          error: apiError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 even with error to prevent UI from breaking
        }
      );
    }
  } catch (error: any) {
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        accounts: [],
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 to prevent UI from breaking
      }
    );
  }
});
