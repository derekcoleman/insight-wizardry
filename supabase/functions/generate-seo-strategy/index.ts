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
    const requestData = await req.json();
    console.log('Received request data:', requestData);

    let analysisPrompt;

    if (requestData.manualInput) {
      // Handle manual input case
      const { targetAudience, additionalInfo } = requestData.manualInput;
      
      analysisPrompt = `As an expert SEO and Content Strategy consultant, generate 15-20 highly specific, actionable content recommendations for the following target audience and context:

Target Audience:
${targetAudience}

Additional Context:
${additionalInfo || 'No additional context provided'}

For each recommendation, provide:
1. Content Focus:
   - Specific topic and angle
   - Target audience segment
   - Content format and type
   
2. Strategic Analysis:
   - Audience pain points addressed
   - Content goals and objectives
   - Competitive advantage
   
3. Implementation Plan:
   - Content structure
   - Key topics to cover
   - Recommended content length
   - Content promotion strategy
   
4. Expected Impact:
   - Target engagement metrics
   - Conversion potential
   - Timeline for results
   
5. Priority Level:
   - High/Medium/Low with reasoning
   - Resource requirements
   - Implementation complexity

Return a JSON object with a 'topics' array containing objects with these fields:
- title (string): Clear, action-oriented title
- description (string): Detailed analysis and implementation plan
- targetKeywords (array): Specific keywords to target
- estimatedImpact (string): Projected impact on engagement and conversions
- priority (string): "high", "medium", or "low" with justification
- pageUrl (string): "new" for new content
- implementationSteps (array): Specific, actionable steps
- conversionStrategy (string): How this will drive conversions`;
    } else {
      // Handle automated analysis case
      const { ga4Data, gscData } = requestData;
      
      // Extract conversion data from GA4
      const monthlyConversions = ga4Data?.monthly?.current?.conversions || 0;
      const monthlyRevenue = ga4Data?.monthly?.current?.revenue || 0;
      const conversionGoal = ga4Data?.monthly?.current?.conversionGoal || 'Total Conversions';

      // Get top performing pages
      const topPages = gscData?.pages?.slice(0, 20) || [];
      const searchTerms = gscData?.searchTerms?.slice(0, 50) || [];

      analysisPrompt = `As an expert SEO and Content Strategy consultant, analyze this data and generate 15-20 highly specific, actionable recommendations. Focus on increasing conversions and revenue through content optimization.

Key Performance Data:
- Monthly Conversions: ${monthlyConversions}
- Monthly Revenue: $${monthlyRevenue}
- Main Conversion Goal: ${conversionGoal}

Top performing pages and their metrics:
${JSON.stringify(topPages, null, 2)}

Search term performance:
${JSON.stringify(searchTerms, null, 2)}

For each recommendation, provide:
1. Specific Page/Content Focus:
   - If existing page: Provide exact URL and current performance metrics
   - If new content: Explain why this specific topic based on data
   
2. Detailed Analysis:
   - Current performance metrics (for existing pages)
   - User behavior patterns
   - Conversion funnel position
   - Content gaps identified
   
3. Specific Implementation Plan:
   - Exact sections to optimize
   - Specific keywords to target
   - Content structure recommendations
   - Internal linking strategy
   
4. Expected Impact:
   - Projected traffic increase (percentage range)
   - Estimated conversion rate improvement
   - Revenue impact projection
   - Timeline for results
   
5. Priority Level:
   - High/Medium/Low with data-backed reasoning
   - Resource requirements
   - Implementation complexity

Return a JSON object with a 'topics' array containing objects with these fields:
- title (string): Clear, action-oriented title
- description (string): Detailed analysis and implementation plan
- targetKeywords (array): Specific keywords with search volume/competition data
- estimatedImpact (string): Detailed projection of traffic, conversion, and revenue impact
- priority (string): "high", "medium", or "low" with justification
- pageUrl (string): Specific URL for existing pages or "new" for new content
- currentMetrics (object): Current performance data for existing pages
- implementationSteps (array): Specific, actionable steps
- conversionStrategy (string): How this will impact conversion rates`;
    }

    try {
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
              content: "You are an expert SEO analyst specializing in conversion rate optimization. Always return a JSON object with a 'topics' array containing the recommendations."
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
      
      // Clean up the content by removing any markdown formatting
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
          ? topic.priority.toLowerCase() 
          : 'medium',
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
      return new Response(
        JSON.stringify({ 
          error: error.message,
          topics: [{
            title: "Content Strategy Analysis Required",
            description: "Unable to generate content strategy. Please try again or check the data input.",
            targetKeywords: ["content strategy", "seo optimization"],
            estimatedImpact: "Unknown - Analysis failed",
            priority: "high",
            pageUrl: "new",
            currentMetrics: null,
            implementationSteps: ["Retry analysis with valid data"],
            conversionStrategy: "Not available"
          }]
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error generating SEO strategy:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        topics: [{
          title: "Error Processing Request",
          description: "Failed to process the analysis request. Please check your input data and try again.",
          targetKeywords: ["error"],
          estimatedImpact: "Unknown",
          priority: "high",
          pageUrl: "new",
          currentMetrics: null,
          implementationSteps: ["Check input data", "Retry request"],
          conversionStrategy: "Not available"
        }]
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});