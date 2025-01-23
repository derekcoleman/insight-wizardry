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

    // Extract conversion data
    const monthlyConversions = ga4Data.monthly?.current?.conversions || 0;
    const monthlyRevenue = ga4Data.monthly?.current?.revenue || 0;
    const quarterlyConversions = ga4Data.quarterly?.current?.conversions || 0;
    const quarterlyRevenue = ga4Data.quarterly?.current?.revenue || 0;

    const analysisPrompt = `As an SEO expert, analyze this data and generate 15-20 strategic recommendations:

Key metrics from GA4:
Monthly Performance:
- Conversions: ${monthlyConversions}
- Revenue: $${monthlyRevenue}
- Other metrics: ${JSON.stringify(ga4Data.monthly?.metrics || {})}

Quarterly Performance:
- Conversions: ${quarterlyConversions}
- Revenue: $${quarterlyRevenue}
- Other metrics: ${JSON.stringify(ga4Data.quarterly?.metrics || {})}

Search terms performance:
${JSON.stringify(gscData.searchTerms?.slice(0, 50) || [])}

Top performing pages:
${JSON.stringify(gscData.pages?.slice(0, 20) || [])}

Analyze and provide recommendations for:
1. Content optimization for pages with high conversion rates
2. User journey optimization opportunities
3. Content gaps in the conversion funnel
4. Search intent alignment with conversion goals
5. Technical improvements that could impact conversion rates
6. New content opportunities based on successful conversion patterns
7. Content structure and internal linking strategy
8. Call-to-action optimization suggestions
9. Mobile vs desktop performance considerations
10. Page speed and user experience factors

For each recommendation include:
- Title
- Description explaining value and approach
- Target keywords
- Estimated impact on conversions and revenue
- Priority (high/medium/low)

Return a JSON object with a 'topics' array containing objects with these fields: title, description, targetKeywords (array), estimatedImpact (string), priority (string).`;

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
            content: "You are an expert SEO and conversion rate optimization analyst. Always return a JSON object with a 'topics' array containing the recommendations."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI API request failed');
    }

    const openAIResponse = await response.json();
    console.log('OpenAI response:', openAIResponse);
    
    let topics;
    try {
      const content = openAIResponse.choices[0].message.content;
      console.log('Response content:', content);
      
      const parsedContent = JSON.parse(content);
      console.log('Parsed content:', parsedContent);

      if (!parsedContent.topics || !Array.isArray(parsedContent.topics)) {
        throw new Error('Response does not contain a topics array');
      }

      topics = parsedContent.topics.map(topic => ({
        title: String(topic.title || ''),
        description: String(topic.description || ''),
        targetKeywords: Array.isArray(topic.targetKeywords) ? topic.targetKeywords.map(String) : [],
        estimatedImpact: String(topic.estimatedImpact || ''),
        priority: ['high', 'medium', 'low'].includes(topic.priority?.toLowerCase()) 
          ? topic.priority.toLowerCase() 
          : 'medium'
      }));

    } catch (e) {
      console.error('Error parsing OpenAI response:', e);
      console.log('Raw response:', openAIResponse.choices[0].message.content);
      
      topics = [{
        title: "Content Strategy Analysis Required",
        description: "Unable to generate content strategy. Please try again or check the data input.",
        targetKeywords: ["content strategy", "seo optimization"],
        estimatedImpact: "Unknown - Analysis failed",
        priority: "high"
      }];
    }

    return new Response(
      JSON.stringify({ topics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating SEO strategy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});