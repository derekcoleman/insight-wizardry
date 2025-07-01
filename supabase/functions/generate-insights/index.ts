
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
    console.log('Generating strategic insights for data:', data);

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
            content: `You are a senior digital marketing strategist and SEO expert with 15+ years of experience analyzing Google Analytics and Search Console data. Your analysis should be comprehensive, actionable, and presented in a structured format that executives and marketing teams can easily understand and act upon.

Analyze the provided data and structure your response with the following sections:

**EXECUTIVE SUMMARY**
Provide a 2-3 sentence high-level overview of the website's performance, highlighting the most critical insights and overall trajectory.

**KEY PERFORMANCE ANALYSIS**
Analyze the core metrics with specific focus on:
- Traffic trends and patterns
- Conversion performance and revenue impact
- Search visibility and organic growth
- User engagement and behavior patterns

**STRATEGIC OBSERVATIONS**
Provide your professional point of view on:
- Market positioning based on search performance
- Competitive landscape insights
- Technical SEO health indicators
- Content performance patterns
- User experience implications

**CRITICAL FINDINGS**
List the most important discoveries that require immediate attention:
- Performance anomalies or concerning trends
- Significant opportunities for growth
- Technical issues affecting performance
- Content gaps or optimization opportunities

**ACTIONABLE RECOMMENDATIONS**
Prioritized recommendations with clear next steps:
- High-impact quick wins (0-30 days)
- Medium-term strategic initiatives (1-3 months)
- Long-term growth opportunities (3-6 months)
- Resource allocation suggestions

**PERFORMANCE BENCHMARKS**
Compare current performance against industry standards and provide context for the metrics.

**RISK ASSESSMENT**
Identify potential risks and threats to current performance levels.

Format your response with clear section headers and use bullet points for easy scanning. Include specific metrics, percentages, and actionable insights throughout. Focus on practical recommendations that can be implemented immediately.`
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
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
