

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
            content: `You are a senior digital marketing strategist and SEO expert with 15+ years of experience analyzing Google Analytics and Search Console data. Your analysis should be comprehensive, actionable, and presented in a structured format with a strong focus on LLM optimization and AI-driven search visibility.

IMPORTANT: You MUST include ALL sections listed below. Do not skip any section, especially the LLM OPTIMIZATION RECOMMENDATIONS section.

Analyze the provided data and structure your response with the following sections:

**EXECUTIVE SUMMARY**
Write a 3-5 sentence executive summary that provides a high-level overview of the website's overall performance trajectory and the most critical insights discovered in the analysis.

**KEY PERFORMANCE METRICS**
For each metric, ALWAYS include the specific time period being analyzed (e.g., "for the period January 1, 2025 to June 27, 2025 vs January 1, 2024 to June 27, 2024"). Format metrics clearly:
- Traffic Performance: Sessions decreased from X to Y (-Z%) for [specific time period]
- Search Visibility: Organic clicks decreased from X to Y (-Z%) for [specific time period] 
- User Engagement: Click-through rate changed from X% to Y% (±Z%) for [specific time period]
- Search Rankings: Average position changed from X to Y (±Z positions) for [specific time period]

**STRATEGIC OBSERVATIONS**
Provide 3-4 key observations about market positioning, competitive landscape, technical SEO health, and content performance patterns.

**CRITICAL FINDINGS**
List 3-4 most important discoveries that require immediate attention, including performance anomalies, growth opportunities, and technical issues.

**LLM OPTIMIZATION RECOMMENDATIONS**
This section is MANDATORY and must provide specific, actionable recommendations based on the latest research showing that LLMs (ChatGPT, Claude, Perplexity) reward different content factors than traditional search engines. Analyze the provided pages data and provide specific recommendations:

Content Quality & Structure Analysis:
- Review the top-performing pages and identify which ones need increased word count for comprehensive coverage
- Assess readability and recommend improvements to achieve Flesch readability scores of 60+
- Identify pages that would benefit from list-based formats (bulleted lists, numbered steps, FAQ sections)
- Recommend specific pages where structured Q&A content should be added for better snippet extraction

Content Freshness Assessment:
- Examine the page URLs provided and identify which pages likely need content updates
- Prioritize pages that haven't been refreshed recently (content older than 10 months should be flagged)
- Recommend specific refresh strategies for top-performing pages to maintain their 4.8× citation advantage
- Suggest a content update schedule based on page performance and traffic patterns

Technical LLM Optimization:
- Recommend implementing comprehensive schema markup across high-traffic pages
- Suggest creating LLMs.txt files to guide AI crawler behavior for the domain
- Identify URL structure improvements for better semantic understanding
- Recommend meta description optimization for the top-performing pages to improve snippet extraction
- Suggest Bing indexing optimization strategies since LLMs heavily scrape Bing's index

Third-Party Signal Enhancement:
- Based on the domain and content type, recommend relevant community forums and Reddit strategies
- Suggest review platform strategies (G2, Trustpilot) appropriate for the business type
- Recommend Google Business Profile optimizations if applicable
- Identify industry-specific forums and communities for thought leadership opportunities

**RECOMMENDATIONS**
Write a 3-5 sentence recommendations paragraph that provides clear, prioritized next steps for improving performance in both traditional search and AI-driven search. Focus on the most impactful actions that can be taken in the next 30-90 days, emphasizing content freshness, structure optimization, and LLM-friendly formatting.

Format your response with clear section headers using **SECTION NAME** formatting. Include specific metrics, percentages, and time periods throughout. Always specify the exact time periods when mentioning performance changes. Pay special attention to content age and freshness when making recommendations.`
          },
          {
            role: "user",
            content: JSON.stringify(data),
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
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
