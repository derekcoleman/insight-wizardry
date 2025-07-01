
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.14';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

if (!openAIApiKey) {
  console.error('OPENAI_API_KEY environment variable is not set');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const { data } = await req.json();
    console.log('Generating strategic insights for data keys:', Object.keys(data || {}));

    // Extract domain from the data to crawl sitemap
    let domain = '';
    if (data.weekly_analysis?.pages?.[0]?.page) {
      try {
        const url = new URL(data.weekly_analysis.pages[0].page);
        domain = `${url.protocol}//${url.hostname}`;
      } catch (error) {
        console.log('Could not extract domain from page URL');
      }
    }

    // Crawl sitemap to get last modified dates and top pages SEO data
    let sitemapData = null;
    let pageData = null;
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (domain) {
      try {
        console.log('Crawling sitemap for domain:', domain);

        const { data: sitemapResult } = await supabase.functions.invoke('crawl-sitemap', {
          body: { domain }
        });

        if (sitemapResult && !sitemapResult.error) {
          sitemapData = sitemapResult;
          console.log('Sitemap data retrieved:', sitemapData.totalUrls, 'URLs found');
        }
      } catch (error) {
        console.log('Failed to crawl sitemap:', error);
      }
    }

    // Get top pages from analytics data for detailed SEO analysis
    const topPages = [];
    if (data.weekly_analysis?.pages) {
      topPages.push(...data.weekly_analysis.pages.slice(0, 5).map(p => p.page));
    }
    if (data.monthly_analysis?.pages && topPages.length < 5) {
      const additionalPages = data.monthly_analysis.pages
        .filter(p => !topPages.includes(p.page))
        .slice(0, 5 - topPages.length)
        .map(p => p.page);
      topPages.push(...additionalPages);
    }

    // Crawl top pages for SEO analysis
    if (topPages.length > 0) {
      try {
        console.log('Crawling top pages for SEO analysis:', topPages);
        const { data: pageResult } = await supabase.functions.invoke('crawl-page-seo', {
          body: { urls: topPages }
        });

        if (pageResult && !pageResult.error) {
          pageData = pageResult.pageData;
          console.log('Page SEO data retrieved for', pageData?.length || 0, 'pages');
        }
      } catch (error) {
        console.log('Failed to crawl page SEO data:', error);
      }
    }

    // Prepare enhanced data with sitemap and page SEO information
    const enhancedData = {
      ...data,
      sitemapData,
      pageData,
      domain
    };

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

IMPORTANT: You MUST include ALL sections listed below. Do not skip any section, especially the LLM OPTIMIZATION RECOMMENDATIONS section which must be specific and data-driven.

Analyze the provided data and structure your response with the following sections:

**EXECUTIVE SUMMARY**
Write a 3-5 sentence executive summary that provides a high-level overview of the website's overall performance trajectory and the most critical insights discovered in the analysis.

**KEY PERFORMANCE METRICS**
For each metric, ALWAYS include the specific time period being analyzed. Format metrics clearly:
- Traffic Performance: Sessions decreased from X to Y (-Z%) for [specific time period]
- Search Visibility: Organic clicks decreased from X to Y (-Z%) for [specific time period] 
- User Engagement: Click-through rate changed from X% to Y% (±Z%) for [specific time period]
- Search Rankings: Average position changed from X to Y (±Z positions) for [specific time period]

**STRATEGIC OBSERVATIONS**
Provide 3-4 key observations about market positioning, competitive landscape, technical SEO health, and content performance patterns.

**CRITICAL FINDINGS**
List 3-4 most important discoveries that require immediate attention, including performance anomalies, growth opportunities, and technical issues.

**LLM OPTIMIZATION RECOMMENDATIONS**
This section is MANDATORY and must provide specific, actionable recommendations based on the actual data provided. You must provide at least 5 specific recommendations:

Content Quality & Structure Analysis:
- Identify the top 3-5 performing pages by clicks/traffic and analyze their potential for improvement
- For pages with high impressions but low CTR, recommend specific content structure improvements
- Use actual word count data from page analysis to recommend specific improvements
- Identify pages that would benefit from better readability based on current content structure

Content Freshness Assessment:
- Cross-reference high-performing pages with sitemap last-modified dates
- Flag pages that haven't been updated in 10+ months and are losing traffic
- Prioritize content refresh for pages with strong search visibility but declining performance

Technical SEO & LLM Optimization:
- Analyze existing structured data (JSON-LD) on top pages and recommend improvements
- Identify pages missing schema markup and suggest specific schema types to implement
- Review meta descriptions and titles for optimization opportunities based on actual page data
- Suggest creating LLMs.txt files for better AI crawler guidance

Page-Specific SEO Analysis:
- For each top page analyzed, provide specific recommendations based on actual SEO data
- Compare target keywords from search terms data with actual page content and headings
- Identify gaps between ranking keywords and on-page optimization
- Recommend internal linking improvements based on current link structure

**RECOMMENDATIONS**
Write a 3-5 sentence recommendations paragraph that provides clear, prioritized next steps for improving performance in both traditional search and AI-driven search.

Format your response with clear section headers using **SECTION NAME** formatting. Include specific metrics, percentages, and time periods throughout.`
          },
          {
            role: "user",
            content: JSON.stringify(enhancedData),
          },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.choices || !result.choices[0] || !result.choices[0].message) {
      console.error('Invalid OpenAI response structure:', result);
      throw new Error('Invalid response structure from OpenAI API');
    }
    
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
