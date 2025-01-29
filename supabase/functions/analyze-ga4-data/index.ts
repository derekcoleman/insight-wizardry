import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchGA4Data } from "./ga4-service.ts";
import { fetchGSCData, fetchGSCSearchTerms, fetchGSCPages } from "./gsc-service.ts";
import { analyzeTimePeriod } from "./analysis-service.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request with method:', req.method);
    
    const requestBody = await req.json();
    console.log('Request body:', {
      hasGA4Property: !!requestBody.ga4Property,
      hasGSCProperty: !!requestBody.gscProperty,
      hasAccessToken: !!requestBody.accessToken,
      hasMainConversionGoal: !!requestBody.mainConversionGoal,
      accessTokenLength: requestBody.accessToken ? requestBody.accessToken.length : 0,
      accessTokenPrefix: requestBody.accessToken ? requestBody.accessToken.substring(0, 10) + '...' : 'none'
    });

    const { ga4Property, gscProperty, accessToken, mainConversionGoal } = requestBody;

    // Validate required parameters
    if (!ga4Property || !accessToken) {
      console.error('Missing required parameters:', { 
        hasGA4Property: !!ga4Property,
        hasAccessToken: !!accessToken,
        ga4PropertyValue: ga4Property || 'not provided',
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          details: {
            ga4Property: !ga4Property ? 'GA4 property ID is required' : null,
            accessToken: !accessToken ? 'Access token is required' : null
          },
          status: 'error'
        }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate access token format
    if (typeof accessToken !== 'string' || !accessToken.startsWith('ya29.')) {
      console.error('Invalid access token format:', {
        tokenType: typeof accessToken,
        tokenLength: accessToken ? accessToken.length : 0,
        tokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'none'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid access token format',
          details: 'The provided access token appears to be invalid. Please ensure you are properly authenticated with Google.',
          status: 'error'
        }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract domain from GSC property URL if available
    const domain = gscProperty ? new URL(gscProperty).hostname : null;
    console.log('Extracted domain:', domain);

    const cleanPropertyId = ga4Property.replace(/^properties\//, '').replace(/\/$/, '');
    console.log('Clean property ID:', cleanPropertyId);

    // Last 7 days (yesterday to 7 days ago)
    const now = new Date();
    const last7DaysEnd = new Date(now);
    last7DaysEnd.setDate(last7DaysEnd.getDate() - 1);
    const last7DaysStart = new Date(last7DaysEnd);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);
    
    // Previous 7 days
    const prev7DaysEnd = new Date(last7DaysStart);
    prev7DaysEnd.setDate(prev7DaysEnd.getDate() - 1);
    const prev7DaysStart = new Date(prev7DaysEnd);
    prev7DaysStart.setDate(prev7DaysStart.getDate() - 6);

    // Last 28 days
    const last28DaysEnd = new Date(now);
    last28DaysEnd.setDate(last28DaysEnd.getDate() - 1);
    const last28DaysStart = new Date(last28DaysEnd);
    last28DaysStart.setDate(last28DaysStart.getDate() - 27);
    
    // Previous 28 days
    const prev28DaysEnd = new Date(last28DaysStart);
    prev28DaysEnd.setDate(prev28DaysEnd.getDate() - 1);
    const prev28DaysStart = new Date(prev28DaysEnd);
    prev28DaysStart.setDate(prev28DaysStart.getDate() - 27);

    // Last 90 days
    const last90DaysEnd = new Date(now);
    last90DaysEnd.setDate(last90DaysEnd.getDate() - 1);
    const last90DaysStart = new Date(last90DaysEnd);
    last90DaysStart.setDate(last90DaysStart.getDate() - 89);
    
    // Previous 90 days
    const prev90DaysEnd = new Date(last90DaysStart);
    prev90DaysEnd.setDate(prev90DaysEnd.getDate() - 1);
    const prev90DaysStart = new Date(prev90DaysEnd);
    prev90DaysStart.setDate(prev90DaysStart.getDate() - 89);

    // YTD
    const ytdEnd = new Date(now);
    ytdEnd.setDate(ytdEnd.getDate() - 1);
    const ytdStart = new Date(ytdEnd.getFullYear(), 0, 1);
    
    // Previous YTD
    const prevYtdEnd = new Date(ytdEnd);
    prevYtdEnd.setFullYear(prevYtdEnd.getFullYear() - 1);
    const prevYtdStart = new Date(ytdStart);
    prevYtdStart.setFullYear(prevYtdStart.getFullYear() - 1);

    // Last 28 days YoY
    const last28YoYEnd = new Date(last28DaysEnd);
    const last28YoYStart = new Date(last28DaysStart);
    const prev28YoYEnd = new Date(last28YoYEnd);
    prev28YoYEnd.setFullYear(prev28YoYEnd.getFullYear() - 1);
    const prev28YoYStart = new Date(last28YoYStart);
    prev28YoYStart.setFullYear(prev28YoYStart.getFullYear() - 1);

    try {
      console.log('Starting data fetching process with parameters:', {
        cleanPropertyId,
        domain,
        hasMainConversionGoal: !!mainConversionGoal,
        dateRanges: {
          weekly: {
            start: last7DaysStart.toISOString(),
            end: last7DaysEnd.toISOString()
          },
          monthly: {
            start: last28DaysStart.toISOString(),
            end: last28DaysEnd.toISOString()
          }
        }
      });

      const [
        weeklyGA4Data,
        prevWeekGA4Data,
        monthlyGA4Data,
        prevMonthGA4Data,
        quarterlyGA4Data,
        prevQuarterGA4Data,
        ytdGA4Data,
        prevYtdGA4Data,
        last28YoYGA4Data,
        prev28YoYGA4Data,
        weeklyGSCData,
        prevWeekGSCData,
        monthlyGSCData,
        prevMonthGSCData,
        quarterlyGSCData,
        prevQuarterGSCData,
        ytdGSCData,
        prevYtdGSCData,
        last28YoYGSCData,
        prev28YoYGSCData,
        weeklySearchTerms,
        monthlySearchTerms,
        quarterlySearchTerms,
        ytdSearchTerms,
        last28YoYSearchTerms,
        weeklyPages,
        monthlyPages,
        quarterlyPages,
        ytdPages,
        last28YoYPages
      ] = await Promise.all([
        // GA4 Data
        fetchGA4Data(cleanPropertyId, accessToken, last7DaysStart, last7DaysEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, prev7DaysStart, prev7DaysEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, last28DaysStart, last28DaysEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, prev28DaysStart, prev28DaysEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, last90DaysStart, last90DaysEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, prev90DaysStart, prev90DaysEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, ytdStart, ytdEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, prevYtdStart, prevYtdEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, last28YoYStart, last28YoYEnd, mainConversionGoal),
        fetchGA4Data(cleanPropertyId, accessToken, prev28YoYStart, prev28YoYEnd, mainConversionGoal),
        // GSC Data
        ...(gscProperty ? [
          fetchGSCData(gscProperty, accessToken, last7DaysStart, last7DaysEnd),
          fetchGSCData(gscProperty, accessToken, prev7DaysStart, prev7DaysEnd),
          fetchGSCData(gscProperty, accessToken, last28DaysStart, last28DaysEnd),
          fetchGSCData(gscProperty, accessToken, prev28DaysStart, prev28DaysEnd),
          fetchGSCData(gscProperty, accessToken, last90DaysStart, last90DaysEnd),
          fetchGSCData(gscProperty, accessToken, prev90DaysStart, prev90DaysEnd),
          fetchGSCData(gscProperty, accessToken, ytdStart, ytdEnd),
          fetchGSCData(gscProperty, accessToken, prevYtdStart, prevYtdEnd),
          fetchGSCData(gscProperty, accessToken, last28YoYStart, last28YoYEnd),
          fetchGSCData(gscProperty, accessToken, prev28YoYStart, prev28YoYEnd),
          // Search Terms
          fetchGSCSearchTerms(gscProperty, accessToken, last7DaysStart, last7DaysEnd, prev7DaysStart, prev7DaysEnd),
          fetchGSCSearchTerms(gscProperty, accessToken, last28DaysStart, last28DaysEnd, prev28DaysStart, prev28DaysEnd),
          fetchGSCSearchTerms(gscProperty, accessToken, last90DaysStart, last90DaysEnd, prev90DaysStart, prev90DaysEnd),
          fetchGSCSearchTerms(gscProperty, accessToken, ytdStart, ytdEnd, prevYtdStart, prevYtdEnd),
          fetchGSCSearchTerms(gscProperty, accessToken, last28YoYStart, last28YoYEnd, prev28YoYStart, prev28YoYEnd),
          // Pages
          fetchGSCPages(gscProperty, accessToken, last7DaysStart, last7DaysEnd, prev7DaysStart, prev7DaysEnd),
          fetchGSCPages(gscProperty, accessToken, last28DaysStart, last28DaysEnd, prev28DaysStart, prev28DaysEnd),
          fetchGSCPages(gscProperty, accessToken, last90DaysStart, last90DaysEnd, prev90DaysStart, prev90DaysEnd),
          fetchGSCPages(gscProperty, accessToken, ytdStart, ytdEnd, prevYtdStart, prevYtdEnd),
          fetchGSCPages(gscProperty, accessToken, last28YoYStart, last28YoYEnd, prev28YoYStart, prev28YoYEnd)
        ] : Array(20).fill(null))
      ]);

      console.log('Data fetching completed successfully');
      console.log('Starting analysis process...');

      const analysis = {
        weekly_analysis: {
          ...analyzeTimePeriod(
            weeklyGA4Data, 
            prevWeekGA4Data, 
            weeklyGSCData, 
            prevWeekGSCData, 
            'Week over Week',
            { start: last7DaysStart, end: last7DaysEnd },
            { start: prev7DaysStart, end: prev7DaysEnd }
          ),
          searchTerms: weeklySearchTerms,
          pages: weeklyPages,
          domain
        },
        monthly_analysis: {
          ...analyzeTimePeriod(
            monthlyGA4Data, 
            prevMonthGA4Data, 
            monthlyGSCData, 
            prevMonthGSCData, 
            'Month over Month',
            { start: last28DaysStart, end: last28DaysEnd },
            { start: prev28DaysStart, end: prev28DaysEnd }
          ),
          searchTerms: monthlySearchTerms,
          pages: monthlyPages,
          domain
        },
        quarterly_analysis: {
          ...analyzeTimePeriod(
            quarterlyGA4Data,
            prevQuarterGA4Data,
            quarterlyGSCData,
            prevQuarterGSCData,
            'Last 90 Days',
            { start: last90DaysStart, end: last90DaysEnd },
            { start: prev90DaysStart, end: prev90DaysEnd }
          ),
          searchTerms: quarterlySearchTerms,
          pages: quarterlyPages,
          domain
        },
        ytd_analysis: {
          ...analyzeTimePeriod(
            ytdGA4Data,
            prevYtdGA4Data,
            ytdGSCData,
            prevYtdGSCData,
            'Year to Date',
            { start: ytdStart, end: ytdEnd },
            { start: prevYtdStart, end: prevYtdEnd }
          ),
          searchTerms: ytdSearchTerms,
          pages: ytdPages,
          domain
        },
        last28_yoy_analysis: {
          ...analyzeTimePeriod(
            last28YoYGA4Data,
            prev28YoYGA4Data,
            last28YoYGSCData,
            prev28YoYGSCData,
            'Last 28 Days Year over Year',
            { start: last28YoYStart, end: last28YoYEnd },
            { start: prev28YoYStart, end: prev28YoYEnd }
          ),
          searchTerms: last28YoYSearchTerms,
          pages: last28YoYPages,
          domain
        }
      };

      console.log('Analysis completed successfully');
      return new Response(JSON.stringify({ report: analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Error in data fetching or analysis:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
        properties: error instanceof Error ? Object.keys(error) : undefined,
        stringified: JSON.stringify(error, null, 2)
      });

      // Specific error handling for common Google API errors
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          console.error('Authentication error details:', {
            originalError: error,
            message: error.message,
            stack: error.stack
          });
          return new Response(JSON.stringify({ 
            error: 'Authentication failed',
            details: 'Your Google authentication has expired or is invalid. Please try logging in again.',
            originalError: error.message,
            status: 'error'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
          });
        }
        if (error.message.includes('403')) {
          console.error('Authorization error details:', {
            originalError: error,
            message: error.message,
            stack: error.stack
          });
          return new Response(JSON.stringify({ 
            error: 'Access denied',
            details: 'You do not have permission to access this Google Analytics property. Please check your permissions.',
            originalError: error.message,
            status: 'error'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
      }

      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred during data analysis',
        details: error instanceof Error ? error.stack : undefined,
        type: error instanceof Error ? error.constructor.name : typeof error,
        stringified: JSON.stringify(error, null, 2),
        status: 'error'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error) {
    console.error('Fatal error in analyze-ga4-data function:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      properties: error instanceof Error ? Object.keys(error) : undefined,
      stringified: JSON.stringify(error, null, 2)
    });

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
      stringified: JSON.stringify(error, null, 2),
      status: 'error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
