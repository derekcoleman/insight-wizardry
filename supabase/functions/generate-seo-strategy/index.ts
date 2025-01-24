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

  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { ga4Data, gscData } = await req.json();
    console.log('Analyzing data for content strategy:', { ga4Data, gscData });

    // Extract key metrics and insights
    const monthlyConversions = ga4Data.monthly?.current?.conversions || 0;
    const monthlyRevenue = ga4Data.monthly?.current?.revenue || 0;
    const conversionGoal = ga4Data.monthly?.current?.conversionGoal || 'Total Conversions';
    
    // Get top performing pages and search terms
    const topPages = gscData.pages?.slice(0, 20) || [];
    const searchTerms = gscData.searchTerms?.slice(0, 50) || [];
    const monthlySearchTerms = gscData.monthlySearchTerms || [];
    const quarterlySearchTerms = gscData.quarterlySearchTerms || [];

    // Analyze search term trends
    const allSearchTerms = [...searchTerms, ...monthlySearchTerms, ...quarterlySearchTerms];
    const searchTermFrequency = allSearchTerms.reduce((acc: Record<string, number>, term: any) => {
      const searchTerm = term.term.toLowerCase();
      acc[searchTerm] = (acc[searchTerm] || 0) + 1;
      return acc;
    }, {});

    // Sort search terms by frequency
    const trendingTerms = Object.entries(searchTermFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([term]) => term);

    // Analyze page performance
    const pagePerformance = topPages.map(page => ({
      url: page.page,
      clicks: page.current.clicks,
      impressions: page.current.impressions,
      ctr: parseFloat(page.current.ctr),
      position: parseFloat(page.current.position)
    }));

    const systemPrompt = `You are an expert SEO analyst specializing in data-driven content strategy. Your task is to generate EXACTLY 20 recommendations:
- EXACTLY 10 recommendations for optimizing existing content
- EXACTLY 10 recommendations for new content opportunities
Any other number of recommendations is unacceptable.`;

    const analysisPrompt = `Based on the provided analytics data, generate two sets of recommendations:

1. Existing Content Optimization (EXACTLY 10 recommendations):
Analyze these pages and their metrics:
${JSON.stringify(pagePerformance, null, 2)}

2. New Content Opportunities (EXACTLY 10 recommendations):
Based on these trending search terms:
${JSON.stringify(trendingTerms, null, 2)}

Key Performance Context:
- Monthly Conversions: ${monthlyConversions}
- Monthly Revenue: $${monthlyRevenue}
- Main Conversion Goal: ${conversionGoal}

For existing content recommendations:
- Focus on pages with high impressions but low CTR
- Identify content gaps based on search terms
- Suggest specific improvements based on current performance
- Include clear implementation steps

For new content recommendations:
- Use trending search terms to identify topic opportunities
- Consider search intent and user journey
- Focus on topics with clear conversion potential
- Ensure recommendations align with current performance data

Return a JSON object with a 'topics' array containing EXACTLY 20 objects (10 for existing content, 10 for new content) with these fields:
- title (string): Clear, action-oriented title
- description (string): Detailed analysis and implementation plan
- targetKeywords (array): Specific keywords from the data
- estimatedImpact (string): Projected impact based on current metrics
- priority (string): "high", "medium", or "low" with data-backed justification
- pageUrl (string): URL for existing content or "new" for new content
- currentMetrics (object): Current performance data for existing pages
- implementationSteps (array): Specific, actionable steps
- conversionStrategy (string): How this will impact conversion rates

YOU MUST RETURN EXACTLY 20 RECOMMENDATIONS - 10 for existing content and 10 for new content.`;

    console.log('Sending analysis prompt to OpenAI');

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
            content: systemPrompt
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const openAIResponse = await response.json();
    console.log('Received response from OpenAI');
    
    if (!openAIResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let content = openAIResponse.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Processing OpenAI response');
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    if (!parsedContent.topics || !Array.isArray(parsedContent.topics)) {
      throw new Error('Response does not contain a topics array');
    }

    // Validate we have exactly 20 recommendations
    if (parsedContent.topics.length !== 20) {
      console.error('Incorrect number of recommendations:', parsedContent.topics.length);
      throw new Error('Expected exactly 20 recommendations (10 existing + 10 new)');
    }

    // Count existing vs new content recommendations
    const existingContent = parsedContent.topics.filter(t => t.pageUrl !== 'new').length;
    const newContent = parsedContent.topics.filter(t => t.pageUrl === 'new').length;

    if (existingContent !== 10 || newContent !== 10) {
      console.error('Incorrect distribution of recommendations:', { existingContent, newContent });
      throw new Error(`Expected exactly 10 existing and 10 new content recommendations, got ${existingContent} existing and ${newContent} new`);
    }

    // Process and validate each topic
    const topics = parsedContent.topics.map(topic => ({
      title: String(topic.title || ''),
      description: String(topic.description || ''),
      targetKeywords: Array.isArray(topic.targetKeywords) ? topic.targetKeywords.map(String) : [],
      estimatedImpact: String(topic.estimatedImpact || ''),
      priority: ['high', 'medium', 'low'].includes(topic.priority?.toLowerCase()) 
        ? topic.priority.toLowerCase() 
        : 'medium',
      pageUrl: String(topic.pageUrl || 'new'),
      currentMetrics: topic.currentMetrics || null,
      implementationSteps: Array.isArray(topic.implementationSteps) ? topic.implementationSteps.map(String) : [],
      conversionStrategy: String(topic.conversionStrategy || '')
    }));

    console.log(`Generated ${topics.length} recommendations:`, {
      existingContent: topics.filter(t => t.pageUrl !== 'new').length,
      newContent: topics.filter(t => t.pageUrl === 'new').length
    });

    return new Response(
      JSON.stringify({ topics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating SEO strategy:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        topics: [] // Return empty array instead of error topic
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});