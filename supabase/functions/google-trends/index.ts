import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keywords } = await req.json();
    
    if (!keywords || !Array.isArray(keywords)) {
      throw new Error('Keywords array is required');
    }

    // Initialize Python environment
    const pythonProcess = new Deno.Command("python3", {
      args: ["-c", `
import pandas as pd
from pytrends.request import TrendReq
import json

# Initialize pytrends
pytrends = TrendReq(hl='en-US', tz=360)

# Build payload
keywords = ${JSON.stringify(keywords)}
pytrends.build_payload(keywords[:5], timeframe='today 12-m')

# Get interest over time
interest_df = pytrends.interest_over_time()
interest_data = interest_df.to_json(orient='records')

# Get related queries
related_queries = pytrends.related_queries()
related_data = {k: {
    'top': v['top'].to_dict('records') if v['top'] is not None else [],
    'rising': v['rising'].to_dict('records') if v['rising'] is not None else []
} for k, v in related_queries.items()}

# Get related topics
related_topics = pytrends.related_topics()
topics_data = {k: {
    'top': v['top'].to_dict('records') if v['top'] is not None else [],
    'rising': v['rising'].to_dict('records') if v['rising'] is not None else []
} for k, v in related_topics.items()}

# Combine results
result = {
    'interest_over_time': json.loads(interest_data),
    'related_queries': related_data,
    'related_topics': topics_data
}

print(json.dumps(result))
      `],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await pythonProcess.output();

    if (code === 0) {
      const output = new TextDecoder().decode(stdout);
      const data = JSON.parse(output);
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const error = new TextDecoder().decode(stderr);
      console.error('Python script error:', error);
      throw new Error('Failed to fetch Google Trends data');
    }
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