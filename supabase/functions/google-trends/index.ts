import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendsResponse {
  interest_over_time: any[];
  related_queries: Record<string, {
    top: any[];
    rising: any[];
  }>;
  related_topics: Record<string, {
    top: any[];
    rising: any[];
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keywords } = await req.json();
    
    if (!keywords || !Array.isArray(keywords)) {
      throw new Error('Keywords array is required');
    }

    // For demonstration, we'll return mock data since we can't use pytrends directly
    // In production, you would want to use a proper Google Trends API service
    const mockResponse: TrendsResponse = {
      interest_over_time: keywords.map(keyword => ({
        date: new Date().toISOString(),
        [keyword]: Math.floor(Math.random() * 100)
      })),
      related_queries: Object.fromEntries(
        keywords.map(keyword => [
          keyword,
          {
            top: Array(5).fill(null).map((_, i) => ({
              query: `Related query ${i + 1} for ${keyword}`,
              value: Math.floor(Math.random() * 100)
            })),
            rising: Array(5).fill(null).map((_, i) => ({
              query: `Rising query ${i + 1} for ${keyword}`,
              value: Math.floor(Math.random() * 100)
            }))
          }
        ])
      ),
      related_topics: Object.fromEntries(
        keywords.map(keyword => [
          keyword,
          {
            top: Array(5).fill(null).map((_, i) => ({
              topic_title: `Related topic ${i + 1} for ${keyword}`,
              value: Math.floor(Math.random() * 100)
            })),
            rising: Array(5).fill(null).map((_, i) => ({
              topic_title: `Rising topic ${i + 1} for ${keyword}`,
              value: Math.floor(Math.random() * 100)
            }))
          }
        ])
      )
    };

    return new Response(
      JSON.stringify(mockResponse),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in google-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});