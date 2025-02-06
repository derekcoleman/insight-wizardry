
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

    // First, get the accessible customer IDs
    const listResponse = await fetch(
      'https://googleads.googleapis.com/v14/customers:listAccessibleCustomers',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        },
      }
    );

    const listResponseText = await listResponse.text();
    console.log("List Accessible Customers Response:", listResponseText);

    if (!listResponse.ok) {
      console.error("Google Ads API List Error Response:", {
        status: listResponse.status,
        statusText: listResponse.statusText,
        body: listResponseText,
      });
      throw new Error(`Google Ads API error (${listResponse.status}): ${listResponseText}`);
    }

    let listData;
    try {
      listData = JSON.parse(listResponseText);
    } catch (e) {
      console.error("Failed to parse customer list response:", e);
      throw new Error('Invalid response from Google Ads API');
    }

    if (!listData.resourceNames || listData.resourceNames.length === 0) {
      console.warn("No accessible customers found");
      return new Response(
        JSON.stringify({ accounts: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Extract customer IDs from resource names
    const customerIds = listData.resourceNames.map((resourceName: string) => 
      resourceName.split('/')[1]
    );

    console.log("Found customer IDs:", customerIds);

    // For each customer ID, get the account details
    const accountPromises = customerIds.map(async (customerId: string) => {
      try {
        const detailsResponse = await fetch(
          `https://googleads.googleapis.com/v14/customers/${customerId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': developerToken,
            },
          }
        );

        if (!detailsResponse.ok) {
          console.warn(`Failed to fetch details for customer ${customerId}:`, await detailsResponse.text());
          return {
            id: customerId,
            name: `Account ${customerId}`,
          };
        }

        const details = await detailsResponse.json();
        return {
          id: customerId,
          name: details.descriptiveName || `Account ${customerId}`,
        };
      } catch (error) {
        console.warn(`Error fetching details for customer ${customerId}:`, error);
        return {
          id: customerId,
          name: `Account ${customerId}`,
        };
      }
    });

    const accounts = await Promise.all(accountPromises);
    console.log("Retrieved account details:", accounts);

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
