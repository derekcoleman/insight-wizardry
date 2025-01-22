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
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert SEO and Analytics consultant. Analyze the provided Google Analytics and Search Console data to identify key findings and provide actionable next steps. Focus on:

1. Traffic and Conversion Trends
- Overall organic traffic changes
- Conversion performance
- Revenue impact if applicable

2. Search Performance Analysis
- Click and impression trends
- CTR and position changes
- Branded vs Non-branded performance
  * Analyze the ratio of branded to non-branded traffic
  * Note any significant changes in either category
  * Identify opportunities for improvement

3. Top Pages Analysis
- Identify high-performing pages
- Flag underperforming pages with high impressions but low CTR
- Recommend specific pages for optimization

4. Search Terms Analysis
- Key trending search terms
- Performance of branded vs non-branded terms
- Opportunities for content optimization

Format your response in two sections:
Key Findings:
• List your findings as bullet points
• Focus on the most important insights
• Keep each point clear and concise
• Include specific metrics and percentages when relevant

Recommended Next Steps:
• List specific actions to take
• Make recommendations actionable and clear
• Prioritize high-impact activities
• Include page-specific and keyword-specific recommendations where applicable`,
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