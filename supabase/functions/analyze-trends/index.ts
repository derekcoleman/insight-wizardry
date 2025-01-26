import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keywords, trendsData } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare the data for OpenAI analysis
    const trendsContext = {
      keywords,
      interestOverTime: trendsData.interest_over_time,
      queries: Object.entries(trendsData.related_queries).map(([keyword, data]) => ({
        keyword,
        topQueries: data.top.map(q => q.query),
        risingQueries: data.rising.map(q => q.query)
      }))
    };

    // Get AI-generated insights
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an SEO expert analyzing Google Trends data. Generate clear, specific insights about search patterns and opportunities. Focus on actual search terms and their relationships. Never use phrases like "related query" or "rising query". Instead, directly state what users are searching for and how it relates to the main keywords.`
          },
          {
            role: 'user',
            content: `Analyze this Google Trends data and provide three types of insights:
              1. Seasonal Patterns: Identify how different search terms are used together
              2. Trending Topics: Highlight which specific search terms are gaining popularity
              3. Content Recommendations: Suggest specific content ideas based on the data
              
              Data: ${JSON.stringify(trendsContext, null, 2)}`
          }
        ],
        temperature: 0.7
      }),
    });

    const aiResponse = await response.json();
    
    if (!aiResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid AI response');
    }

    // Parse AI response into structured insights
    const aiContent = aiResponse.choices[0].message.content;
    const sections = aiContent.split('\n\n');
    
    const analysis = {
      seasonal_patterns: sections[0].split('\n').filter(line => line.trim() && !line.toLowerCase().includes('seasonal patterns')),
      trending_topics: sections[1].split('\n').filter(line => line.trim() && !line.toLowerCase().includes('trending topics')),
      keyword_recommendations: sections[2].split('\n').filter(line => line.trim() && !line.toLowerCase().includes('content recommendations')),
    };

    console.log('Generated analysis:', analysis);

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});