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
    const { ga4Data, gscData } = await req.json();
    console.log('Analyzing data:', { ga4Data, gscData });

    // Extract conversion data from GA4
    const monthlyConversions = ga4Data.monthly?.current?.conversions || 0;
    const monthlyRevenue = ga4Data.monthly?.current?.revenue || 0;
    const conversionGoal = ga4Data.monthly?.current?.conversionGoal || 'Total Conversions';

    // Get top performing pages and search terms
    const topPages = gscData.monthlyPages?.slice(0, 20) || [];
    const searchTerms = gscData.monthlySearchTerms?.slice(0, 50) || [];
    const quarterlySearchTerms = gscData.quarterlySearchTerms?.slice(0, 50) || [];

    // Combine and analyze search terms for trends
    const allSearchTerms = [...searchTerms, ...quarterlySearchTerms];
    const searchTermFrequency = allSearchTerms.reduce((acc: any, term: any) => {
      const key = term.term.toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        };
      }
      acc[key].count++;
      acc[key].clicks += term.current.clicks;
      acc[key].impressions += term.current.impressions;
      acc[key].ctr = ((acc[key].clicks / acc[key].impressions) * 100).toFixed(2);
      acc[key].position = (acc[key].position + parseFloat(term.current.position)) / 2;
      return acc;
    }, {});

    // Analyze existing pages performance
    const pagePerformance = topPages.map(page => ({
      url: page.page,
      clicks: page.current.clicks,
      impressions: page.current.impressions,
      ctr: parseFloat(page.current.ctr),
      position: parseFloat(page.current.position),
      clickChange: parseFloat(page.changes.clicks),
    }));

    const analysisPrompt = `As an expert SEO and Content Strategy consultant, analyze this data and generate EXACTLY 20 specific, actionable content recommendations: 10 for optimizing existing content and 10 for new content opportunities. Base all recommendations on the actual performance data provided.

Key Performance Data:
- Monthly Conversions: ${monthlyConversions}
- Monthly Revenue: $${monthlyRevenue}
- Main Conversion Goal: ${conversionGoal}

Existing page performance data:
${JSON.stringify(pagePerformance, null, 2)}

Search term performance and trends:
${JSON.stringify(Object.entries(searchTermFrequency)
  .sort((a: any, b: any) => b[1].impressions - a[1].impressions)
  .slice(0, 30), null, 2)}

Requirements:
1. Generate EXACTLY 10 recommendations for optimizing existing content:
   - Use actual URLs from the provided page performance data
   - Focus on pages with high impressions but low CTR
   - Prioritize pages with declining clicks
   - Include specific optimization steps based on search term data

2. Generate EXACTLY 10 recommendations for new content:
   - Base recommendations on search terms with high impressions but no matching content
   - Focus on topics related to but not directly covered by existing content
   - Ensure recommendations align with conversion goals
   - Include specific keyword targeting strategies

For each recommendation, provide:
1. Title: Clear, action-oriented title
2. Description: Detailed analysis using real metrics
3. Target Keywords: Actual keywords from the search data
4. Estimated Impact: Projections based on current metrics
5. Priority Level: Based on potential impact (high/medium/low)
6. Page URL: Actual URL for existing content, "new" for new content
7. Current Metrics: Include real performance data for existing content
8. Implementation Steps: Specific, actionable steps
9. Conversion Strategy: Based on the main conversion goal

Return a JSON object with a 'topics' array containing EXACTLY 20 objects (10 for existing content, 10 for new content) with these fields:
- title (string)
- description (string)
- targetKeywords (string[])
- estimatedImpact (string)
- priority ("high" | "medium" | "low")
- pageUrl (string)
- currentMetrics (object | null)
- implementationSteps (string[])
- conversionStrategy (string)

Ensure recommendations are specific, data-driven, and directly tied to improving ${conversionGoal}.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert SEO analyst specializing in conversion rate optimization. Generate recommendations based on actual performance data, not generic advice. Always return exactly 20 recommendations."
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
      }

      const openAIResponse = await response.json();
      console.log('OpenAI response:', openAIResponse);
      
      if (!openAIResponse.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      let content = openAIResponse.choices[0].message.content;
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      console.log('Cleaned content:', content);
      
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
        throw new Error(`Expected 20 topics but got ${parsedContent.topics.length}`);
      }

      const topics = parsedContent.topics.map(topic => ({
        title: String(topic.title || ''),
        description: String(topic.description || ''),
        targetKeywords: Array.isArray(topic.targetKeywords) ? topic.targetKeywords.map(String) : [],
        estimatedImpact: String(topic.estimatedImpact || ''),
        priority: ['high', 'medium', 'low'].includes(topic.priority?.toLowerCase()) 
          ? topic.priority.toLowerCase() as 'high' | 'medium' | 'low'
          : 'medium' as const,
        pageUrl: String(topic.pageUrl || 'new'),
        currentMetrics: topic.currentMetrics || null,
        implementationSteps: Array.isArray(topic.implementationSteps) ? topic.implementationSteps.map(String) : [],
        conversionStrategy: String(topic.conversionStrategy || '')
      }));

      // Validate the split between existing and new content
      const existingContent = topics.filter(t => t.pageUrl !== 'new');
      const newContent = topics.filter(t => t.pageUrl === 'new');

      console.log(`Generated ${existingContent.length} existing content and ${newContent.length} new content recommendations`);

      return new Response(
        JSON.stringify({ topics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error in OpenAI request:', error);
      throw error;
    }
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