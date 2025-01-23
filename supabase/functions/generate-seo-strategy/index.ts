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
    // In a real implementation, we would fetch GA4 and GSC data here
    // For now, we'll use OpenAI to generate recommendations based on a prompt
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
            content: `You are an SEO expert tasked with generating content strategy recommendations. 
            Generate 10-20 content topics that would be valuable for a website. 
            For each topic, include:
            - A clear title
            - A brief description
            - Target keywords
            - Estimated impact
            - Priority level (high/medium/low)
            Format the response as a JSON array of topics.`
          },
          {
            role: "user",
            content: "Generate a comprehensive SEO content strategy focusing on high-impact topics."
          }
        ],
        temperature: 0.7
      }),
    });

    const openAIResponse = await response.json();
    let topics;
    
    try {
      // Parse the response content as JSON
      topics = JSON.parse(openAIResponse.choices[0].message.content);
    } catch (e) {
      // If parsing fails, try to extract structured data from the text
      const content = openAIResponse.choices[0].message.content;
      topics = [
        {
          title: "Default Topic",
          description: "Generated content strategy unavailable. Please try again.",
          targetKeywords: ["seo", "content strategy"],
          estimatedImpact: "Unknown",
          priority: "medium"
        }
      ];
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