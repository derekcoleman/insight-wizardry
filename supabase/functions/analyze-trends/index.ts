import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { keywords, trendsData } = await req.json();

    // Analyze the provided keywords and trends data to generate insights
    const generateSeasonalPatterns = (keywords: string[]) => {
      return keywords.map(keyword => {
        const keywordData = trendsData?.interest_over_time?.filter(point => point[keyword]);
        if (!keywordData?.length) return null;

        const relatedQueries = trendsData?.related_queries?.[keyword];
        if (!relatedQueries) return null;

        // Use actual related queries to generate meaningful patterns
        const topQueries = relatedQueries.top || [];
        if (topQueries.length > 0) {
          return `Search interest for '${keyword}' shows strong correlation with '${topQueries[0].query}', suggesting related content opportunities`;
        }
        return `Search interest for '${keyword}' shows consistent search patterns worth monitoring`;
      }).filter(Boolean);
    };

    const generateTrendingTopics = (keywords: string[]) => {
      return keywords.map(keyword => {
        const relatedQueries = trendsData?.related_queries?.[keyword];
        if (!relatedQueries) return null;

        // Use actual rising queries to identify trending topics
        const risingQueries = relatedQueries.rising || [];
        if (risingQueries.length > 0) {
          return `Increasing search interest in '${risingQueries[0].query}' indicates growing demand in ${keyword} space`;
        }
        return null;
      }).filter(Boolean);
    };

    const generateRecommendations = (keywords: string[]) => {
      return keywords.map(keyword => {
        const relatedQueries = trendsData?.related_queries?.[keyword];
        if (!relatedQueries) return null;

        // Use actual queries for recommendations
        const topQueries = relatedQueries.top || [];
        const risingQueries = relatedQueries.rising || [];
        
        if (topQueries.length > 0 || risingQueries.length > 0) {
          const targetQuery = risingQueries[0]?.query || topQueries[0]?.query;
          if (targetQuery) {
            return `Create content exploring the relationship between '${keyword}' and '${targetQuery}' to capture growing search interest`;
          }
        }
        return null;
      }).filter(Boolean);
    };

    const analysis = {
      seasonal_patterns: generateSeasonalPatterns(keywords),
      trending_topics: generateTrendingTopics(keywords),
      keyword_recommendations: generateRecommendations(keywords),
    };

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});