
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
            content: `You are a senior marketing strategist and growth advisor providing C-level insights for a CMO or Head of Growth. Your analysis should be strategic, actionable, and focused on business impact.

CRITICAL INSTRUCTIONS:
- Write for senior marketing leaders who need to make strategic decisions
- Every insight must answer "So what?" - what should they do about it?
- Focus on business impact, not just data trends
- Include specific recommendations with estimated impact
- Compare performance to industry benchmarks when possible
- Identify opportunities for optimization and growth

ANALYSIS FRAMEWORK:

1. **Executive Summary** (CMO-Ready Overview)
   - Lead with the most critical business insight
   - Include key performance indicators: CAC, ROAS, CTR, CVR, LTV implications
   - Use movement indicators (↑↓ or % change) with context
   - Provide "What this means" explanations for each major trend
   - Add strategic commentary based on patterns

2. **Priority Action Items** (3-5 High-Impact Actions)
   - List actionable recommendations with:
     * Estimated impact (e.g., "+12% CVR potential")
     * Effort level (Low/Medium/High)
     * Suggested owners (e.g., "Paid Media Lead," "CRO Team")
     * Timeline for implementation

3. **Competitive Context & Benchmarking**
   - Compare key metrics to industry standards
   - Flag underperformance areas and opportunities
   - Suggest competitive advantages to leverage

4. **Funnel Analysis & Optimization**
   - Identify conversion bottlenecks
   - Calculate drop-off rates at each stage
   - Suggest specific optimization opportunities

Format your response as structured sections with clear headers. Use bullet points for readability. Include specific numbers and percentages where relevant.`
          },
          {
            role: "user",
            content: `Analyze this marketing performance data and provide strategic insights for senior leadership:

${JSON.stringify(data, null, 2)}

Focus on:
1. Strategic business implications
2. Actionable recommendations with impact estimates
3. Competitive positioning opportunities
4. Conversion funnel optimization priorities`,
          },
        ],
        temperature: 0.7,
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
