
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
      
      // First, get the list of accessible customers
      const loginCustomerResponse = await fetch(
        'https://googleads.googleapis.com/v16/customers:listAccessibleCustomers',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
            'login-customer-id': '_', // Required header for v16
          },
        }
      );

      // Log the full response for debugging
      const loginResponseText = await loginCustomerResponse.text();
      console.log("Google Ads API Response:", {
        status: loginCustomerResponse.status,
        statusText: loginCustomerResponse.statusText,
        headers: Object.fromEntries(loginCustomerResponse.headers.entries()),
        body: loginResponseText,
      });

      if (!loginCustomerResponse.ok) {
        console.error("Google Ads API error response:", {
          status: loginCustomerResponse.status,
          body: loginResponseText
        });
        
        return new Response(
          JSON.stringify({ 
            error: `Failed to get accessible customers: ${loginCustomerResponse.statusText}`,
            details: loginResponseText,
            status: loginCustomerResponse.status
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
        console.log("Parsed API response:", data);
      } catch (e) {
        console.error("Failed to parse API response:", e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid API response',
            details: 'Failed to parse the Google Ads API response',
            rawResponse: loginResponseText
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      if (!data.resourceNames || !Array.isArray(data.resourceNames)) {
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

      const customerIds = data.resourceNames.map((resource: string) => {
        const matches = resource.match(/customers\/(\d+)/);
        return matches ? matches[1] : null;
      }).filter(Boolean);

      console.log("Extracted customer IDs:", customerIds);

      const accounts = [];
      for (const customerId of customerIds) {
        try {
          console.log(`Fetching details for customer ${customerId}...`);
          const customerResponse = await fetch(
            `https://googleads.googleapis.com/v16/customers/${customerId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'Content-Type': 'application/json',
                'login-customer-id': customerId,
              },
            }
          );

          if (customerResponse.ok) {
            const customerData = await customerResponse.json();
            console.log(`Customer ${customerId} details:`, customerData);
            accounts.push({
              id: customerId,
              name: customerData.descriptiveName || `Account ${customerId}`,
            });
          } else {
            console.warn(`Failed to fetch details for customer ${customerId}:`, 
              await customerResponse.text()
            );
          }
        } catch (error) {
          console.warn(`Error fetching details for customer ${customerId}:`, error);
        }
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
