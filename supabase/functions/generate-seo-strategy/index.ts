import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { ga4Data, gscData } = await req.json();
    console.log('Analyzing data:', { ga4Data, gscData });

    const analysisPrompt = `As an SEO expert, analyze this data and generate 10-15 strategic recommendations:

Key metrics from GA4:
- Monthly trends: ${JSON.stringify(ga4Data.monthly?.metrics || {})}
- Quarterly trends: ${JSON.stringify(ga4Data.quarterly?.metrics || {})}

Search terms performance:
${JSON.stringify(gscData.searchTerms?.slice(0, 50) || [])}

Top performing pages:
${JSON.stringify(gscData.pages?.slice(0, 20) || [])}

Generate strategic recommendations that would improve SEO performance, including:
1. Optimization of existing content
2. New content opportunities
3. Technical improvements

For each recommendation include:
- Title
- Description explaining value and approach
- Target keywords
- Estimated impact
- Priority (high/medium/low)

Return ONLY a valid JSON array with objects containing these fields: title, description, targetKeywords (array), estimatedImpact (string), priority (string). Do not include any markdown formatting or code block syntax.`;

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
            content: "You are an expert SEO analyst. Always return valid JSON without any markdown formatting."
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
      throw new Error('OpenAI API request failed');
    }

    const openAIResponse = await response.json();
    console.log('OpenAI response:', openAIResponse);
    
    let topics;
    try {
      // Clean up the response content by removing any markdown formatting
      const content = openAIResponse.choices[0].message.content;
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      console.log('Cleaned content:', cleanContent);
      
      topics = JSON.parse(cleanContent);
      console.log('Parsed topics:', topics);

      // Validate the parsed data structure
      if (!Array.isArray(topics)) {
        throw new Error('Response is not an array');
      }

      topics = topics.map(topic => ({
        title: String(topic.title || ''),
        description: String(topic.description || ''),
        targetKeywords: Array.isArray(topic.targetKeywords) ? topic.targetKeywords.map(String) : [],
        estimatedImpact: String(topic.estimatedImpact || ''),
        priority: ['high', 'medium', 'low'].includes(topic.priority) ? topic.priority : 'medium'
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