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
    console.error('OpenAI API key not configured');
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
      const searchTerm = term.term?.toLowerCase() || '';
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
      clicks: page.current?.clicks || 0,
      impressions: page.current?.impressions || 0,
      ctr: parseFloat(page.current?.ctr || '0'),
      position: parseFloat(page.current?.position || '0')
    }));

    const systemPrompt = `You are an expert SEO analyst specializing in data-driven content strategy. Your task is to generate EXACTLY 20 recommendations:
- EXACTLY 10 recommendations for optimizing existing content
- EXACTLY 10 recommendations for new content opportunities

You MUST return a valid JSON object with this EXACT structure:
{
  "topics": [
    {
      "title": "string",
      "description": "string",
      "targetKeywords": ["string"],
      "estimatedImpact": "string",
      "priority": "high|medium|low",
      "pageUrl": "string",
      "currentMetrics": {},
      "implementationSteps": ["string"],
      "conversionStrategy": "string"
    }
  ]
}

The response MUST contain EXACTLY 20 items in the topics array:
- First 10 items MUST use actual URLs from the provided pagePerformance data
- Last 10 items MUST have pageUrl set to "new"

Any other format or number of recommendations will result in an error.`;

    const analysisPrompt = `Based on the provided analytics data, generate recommendations following these STRICT requirements:

1. For EXISTING content (EXACTLY 10 recommendations):
Analyze these pages and metrics:
${JSON.stringify(pagePerformance, null, 2)}

2. For NEW content (EXACTLY 10 recommendations):
Based on these trending terms:
${JSON.stringify(trendingTerms, null, 2)}

Key Performance Context:
- Monthly Conversions: ${monthlyConversions}
- Monthly Revenue: $${monthlyRevenue}
- Main Conversion Goal: ${conversionGoal}

IMPORTANT: You MUST generate EXACTLY:
- 10 recommendations for existing content using actual URLs from pagePerformance
- 10 recommendations for new content with pageUrl set to "new"

Each recommendation MUST include all fields from the JSON structure provided.`;

    console.log('Sending analysis prompt to OpenAI');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.2,
        max_tokens: 4000,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
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
      console.error('Invalid response format from OpenAI');
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
      console.error('Response does not contain a topics array');
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
        topics: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});