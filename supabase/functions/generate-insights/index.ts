import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data } = await req.json();
    console.log('Generating insights for data:', data);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert SEO and Analytics consultant. Analyze the provided Google Analytics and Search Console data to identify key findings and provide actionable next steps. Focus on:

1. Traffic and Conversion Trends
- Overall organic traffic changes
- Conversion performance and trends
- Revenue impact and patterns
- Compare current performance against previous periods

2. Search Performance Analysis
- Click and impression trends
- CTR and position changes
- Branded vs Non-branded Performance
  * Analyze the ratio of branded to non-branded traffic
  * Note significant changes in either category
  * Identify opportunities for improvement in both areas

3. Top Pages Analysis
- Identify high-performing pages
- Flag underperforming pages with potential (high impressions but low CTR)
- Recommend specific optimization opportunities
- Note any significant changes in page performance

4. Search Terms Analysis
- Key trending search terms (both branded and non-branded)
- New or emerging keyword opportunities
- Terms with position improvements or declines
- Opportunities for content optimization based on search intent

Format your response in two sections:
Key Findings:
• List your findings as bullet points
• Focus on the most important insights
• Keep each point clear and concise
• Include specific metrics and percentages when relevant
• Highlight both positive trends and areas of concern
• Compare branded vs non-branded performance where relevant

Recommended Next Steps:
• List specific actions to take
• Make recommendations actionable and clear
• Prioritize high-impact activities
• Include page-specific and keyword-specific recommendations
• Provide specific optimization suggestions for underperforming pages
• Suggest content strategies based on search term analysis`
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const result = await response.json();
    return new Response(
      JSON.stringify({ insights: result.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});