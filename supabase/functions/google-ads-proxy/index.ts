
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
      // Get initial account information from Google OAuth userinfo
      const userinfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v1/userinfo',
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
      console.log("User info:", userInfo);

      // Use Google Ads Query Language (GAQL) with the new API
      const adsResponse = await fetch(
        'https://googleads.googleapis.com/v15/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'login-customer-id': '0', // Use 0 to get all accessible accounts
          }
        }
      );

      const adsResponseText = await adsResponse.text();
      console.log("Google Ads API Response:", {
        status: adsResponse.status,
        statusText: adsResponse.statusText,
        headers: Object.fromEntries(adsResponse.headers.entries()),
        body: adsResponseText
      });

      if (!adsResponse.ok) {
        throw new Error(`Google Ads API error: ${adsResponse.statusText}`);
      }

      let accounts = [];
      try {
        const adsData = JSON.parse(adsResponseText);
        console.log("Parsed Google Ads response:", adsData);

        if (adsData.resourceNames && Array.isArray(adsData.resourceNames)) {
          accounts = adsData.resourceNames.map((resourceName: string) => {
            const accountId = resourceName.split('/').pop();
            return {
              id: accountId,
              name: `Google Ads Account ${accountId}`
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse Google Ads response:", e);
        throw new Error("Invalid response format from Google Ads API");
      }

      if (accounts.length === 0) {
        console.warn("No Google Ads accounts found");
        return new Response(
          JSON.stringify({ 
            accounts: [],
            warning: 'No Google Ads accounts found for this user'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

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
