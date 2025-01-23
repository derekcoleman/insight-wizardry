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

    // Prepare the data for OpenAI analysis
    const analysisPrompt = `As an SEO expert, analyze this Google Analytics and Search Console data:

GA4 Data:
${JSON.stringify(ga4Data, null, 2)}

Search Console Data (including page performance and search terms):
${JSON.stringify(gscData, null, 2)}

Based on this data:
1. Identify pages with declining organic traffic and recommend specific improvements
2. Find pages with high impressions but low CTR and suggest title/meta optimizations
3. Analyze current keyword rankings and identify expansion opportunities
4. Consider user behavior patterns and conversion data
5. Look for content gaps based on search term data

Generate 10-15 strategic recommendations that would improve SEO performance, including both:
A. Optimization of existing content (based on declining performance or opportunities)
B. New content opportunities (based on keyword gaps and user intent)

For each recommendation include:
- A clear, actionable title
- A brief description explaining the value and approach
- Specific target keywords based on the data
- Estimated impact on traffic and conversions
- Priority level (high/medium/low) based on potential ROI

Format your response as a JSON array of topic objects with these exact fields:
title, description, targetKeywords (array), estimatedImpact (string), priority (high/medium/low)`;

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
            content: "You are an expert SEO analyst specializing in content strategy development and optimization."
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
      topics = JSON.parse(openAIResponse.choices[0].message.content);
      console.log('Generated topics:', topics);
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