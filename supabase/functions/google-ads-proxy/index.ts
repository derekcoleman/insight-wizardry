
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

    const response = await fetch(
      'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText = await response.text();
    console.log("Raw Google Ads API Response:", responseText);

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

    if (!data.resourceNames) {
      console.warn("No accounts found in Google Ads API response");
      return new Response(
        JSON.stringify({ accounts: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const accounts = data.resourceNames.map((resourceName: string) => {
      const customerId = resourceName.split('/')[1];
      return {
        id: customerId,
        name: `Account ${customerId}`,
      };
    });

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
    
    // Send a more detailed error response
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
