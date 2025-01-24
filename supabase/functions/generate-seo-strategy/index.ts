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
        };
      }
      acc[key].count++;
      acc[key].clicks += term.current.clicks;
      acc[key].impressions += term.current.impressions;
      return acc;
    }, {});

    const analysisPrompt = `As an expert SEO and Content Strategy consultant, analyze this data and generate specific, actionable content recommendations based on the actual performance data provided. Focus on increasing conversions and revenue through content optimization.

Key Performance Data:
- Monthly Conversions: ${monthlyConversions}
- Monthly Revenue: $${monthlyRevenue}
- Main Conversion Goal: ${conversionGoal}

Top performing pages and their metrics:
${JSON.stringify(topPages, null, 2)}

Search term performance and trends:
${JSON.stringify(Object.entries(searchTermFrequency)
  .sort((a: any, b: any) => b[1].count - a[1].count)
  .slice(0, 20), null, 2)}

For each recommendation, provide:
1. Specific Page/Content Focus:
   - If existing page: Use actual URL and current performance metrics
   - If new content: Base recommendation on actual search trends and gaps
   
2. Detailed Analysis:
   - Use real performance metrics from the data
   - Identify actual user behavior patterns
   - Map to the conversion funnel
   - Point out specific content gaps based on search terms
   
3. Specific Implementation Plan:
   - Target actual high-performing keywords from the data
   - Suggest improvements based on real metrics
   - Include internal linking strategy using existing pages
   
4. Expected Impact:
   - Base projections on current metrics
   - Estimate improvements using actual conversion rates
   - Project revenue impact using real data
   
5. Priority Level:
   - Determine priority based on current performance
   - Consider resource requirements
   - Factor in potential ROI based on actual data

Return a JSON object with a 'topics' array containing objects with these fields:
- title (string): Clear, action-oriented title based on actual opportunities
- description (string): Detailed analysis using real metrics
- targetKeywords (array): Keywords from actual search data
- estimatedImpact (string): Projections based on current metrics
- priority ("high" | "medium" | "low"): Data-driven priority
- pageUrl (string): Actual URL or "new" for new content
- currentMetrics (object): Real performance data
- implementationSteps (array): Specific, actionable steps
- conversionStrategy (string): Strategy based on actual conversion data`;

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
              content: "You are an expert SEO analyst specializing in conversion rate optimization. Generate recommendations based on actual performance data, not generic advice."
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