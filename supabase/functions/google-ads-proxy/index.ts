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
    
    if (!developerToken) {
      throw new Error('Developer token not configured');
    }

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    console.log("Fetching Google Ads test account...");
    
    // When using a test developer token, we need to use a test account
    // This is a sample test account ID - you should replace it with your test account
    const testAccountId = '1234567890';
    
    // For test tokens, we'll just return the test account
    const accounts = [{
      id: testAccountId,
      name: 'Test Account',
    }];

    console.log("Returning test account data:", accounts);

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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});