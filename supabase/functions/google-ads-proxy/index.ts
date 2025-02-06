
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
    
    console.log("Starting Google Ads API request");
    console.log("Access token received:", !!accessToken);
    console.log("Developer token configured:", !!developerToken);
    
    if (!developerToken) {
      console.error("Developer token not configured");
      throw new Error('Google Ads developer token not configured. Please set GOOGLE_ADS_DEVELOPER_TOKEN in Supabase.');
    }

    if (!accessToken) {
      console.error("No access token provided");
      throw new Error('Access token is required');
    }

    console.log("Fetching Google Ads accounts with developer token...");

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };

    console.log("Request headers:", {
      'Authorization': `Bearer ${accessToken.substring(0, 10)}...`,
      'developer-token': `${developerToken.substring(0, 5)}...`,
    });

    // Fetch the customer accounts using the Google Ads API
    const response = await fetch(
      'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
      { headers }
    );

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Ads API Error Response:", errorText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
        console.error("Parsed error details:", errorDetails);
      } catch {
        errorDetails = { message: errorText };
        console.error("Raw error text:", errorText);
      }
      
      throw new Error(`Google Ads API error (${response.status}): ${JSON.stringify(errorDetails)}`);
    }

    const data = await response.json();
    console.log("Google Ads API Success Response:", data);

    // Format the response to match our existing interface
    const accounts = data.resourceNames?.map((resourceName: string) => {
      // Extract the customer ID from the resource name (format: customers/{customer_id})
      const customerId = resourceName.split('/')[1];
      return {
        id: customerId,
        name: `Account ${customerId}`, // For now, we'll use a simple name format
      };
    }) || [];

    console.log("Returning formatted accounts:", accounts);

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
        details: error.stack,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
