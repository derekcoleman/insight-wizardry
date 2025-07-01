import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageSEOData {
  url: string;
  title?: string;
  metaDescription?: string;
  h1Tags: string[];
  h2Tags: string[];
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  structuredData: any[];
  imageAlt: string[];
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
  loadTime: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();
    console.log('Crawling SEO data for URLs:', urls?.length || 0);

    if (!urls || !Array.isArray(urls)) {
      throw new Error('URLs array is required');
    }

    const results: PageSEOData[] = [];
    
    // Limit to top 5 pages to avoid timeout
    const urlsToProcess = urls.slice(0, 5);

    for (const url of urlsToProcess) {
      console.log('Analyzing page:', url);
      const startTime = Date.now();
      
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!response.ok) {
          results.push({
            url,
            h1Tags: [],
            h2Tags: [],
            structuredData: [],
            imageAlt: [],
            internalLinks: 0,
            externalLinks: 0,
            wordCount: 0,
            loadTime: Date.now() - startTime,
            error: `HTTP ${response.status}`
          });
          continue;
        }

        const html = await response.text();
        const loadTime = Date.now() - startTime;

        // Extract SEO data using regex patterns
        const pageData: PageSEOData = {
          url,
          title: extractContent(html, /<title[^>]*>(.*?)<\/title>/s),
          metaDescription: extractMetaContent(html, 'description'),
          h1Tags: extractMultiple(html, /<h1[^>]*>(.*?)<\/h1>/gs),
          h2Tags: extractMultiple(html, /<h2[^>]*>(.*?)<\/h2>/gs),
          keywords: extractMetaContent(html, 'keywords'),
          canonicalUrl: extractLinkHref(html, 'canonical'),
          ogTitle: extractMetaContent(html, 'og:title'),
          ogDescription: extractMetaContent(html, 'og:description'),
          twitterTitle: extractMetaContent(html, 'twitter:title'),
          twitterDescription: extractMetaContent(html, 'twitter:description'),
          structuredData: extractStructuredData(html),
          imageAlt: extractImageAlt(html),
          internalLinks: countInternalLinks(html, url),
          externalLinks: countExternalLinks(html, url),
          wordCount: countWords(html),
          loadTime
        };

        results.push(pageData);
        console.log(`Analyzed ${url}: ${pageData.wordCount} words, ${pageData.structuredData.length} structured data items`);
        
      } catch (error) {
        console.error(`Error analyzing ${url}:`, error);
        results.push({
          url,
          h1Tags: [],
          h2Tags: [],
          structuredData: [],
          imageAlt: [],
          internalLinks: 0,
          externalLinks: 0,
          wordCount: 0,
          loadTime: Date.now() - startTime,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ pageData: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crawl-page-seo function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractContent(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : undefined;
}

function extractMetaContent(html: string, name: string): string | undefined {
  const regex = new RegExp(`<meta[^>]*(?:name|property)=['"]${name}['"][^>]*content=['"]([^'"]*?)['"]`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractLinkHref(html: string, rel: string): string | undefined {
  const regex = new RegExp(`<link[^>]*rel=['"]${rel}['"][^>]*href=['"]([^'"]*?)['"]`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : undefined;
}

function extractMultiple(html: string, regex: RegExp): string[] {
  const matches = html.match(regex) || [];
  return matches.map(match => 
    match.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
  ).filter(text => text.length > 0);
}

function extractStructuredData(html: string): any[] {
  const jsonLdRegex = /<script[^>]*type=['"]application\/ld\+json['"][^>]*>(.*?)<\/script>/gs;
  const matches = html.match(jsonLdRegex) || [];
  
  const structuredData: any[] = [];
  
  for (const match of matches) {
    try {
      const jsonMatch = match.match(/<script[^>]*type=['"]application\/ld\+json['"][^>]*>(.*?)<\/script>/s);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[1].trim());
        structuredData.push(json);
      }
    } catch (error) {
      // Skip invalid JSON-LD
    }
  }
  
  return structuredData;
}

function extractImageAlt(html: string): string[] {
  const imgRegex = /<img[^>]*alt=['"]([^'"]*?)['"][^>]*>/gs;
  const matches = html.match(imgRegex) || [];
  return matches.map(match => {
    const altMatch = match.match(/alt=['"]([^'"]*?)['"]/)!;
    return altMatch[1].trim();
  }).filter(alt => alt.length > 0);
}

function countInternalLinks(html: string, baseUrl: string): number {
  const domain = new URL(baseUrl).hostname;
  const linkRegex = /<a[^>]*href=['"]([^'"]*?)['"][^>]*>/gs;
  const matches = html.match(linkRegex) || [];
  
  return matches.filter(match => {
    const hrefMatch = match.match(/href=['"]([^'"]*?)['"]/)!;
    const href = hrefMatch[1];
    
    if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) return true;
    if (href.startsWith('http')) {
      try {
        return new URL(href).hostname === domain;
      } catch {
        return false;
      }
    }
    return true;
  }).length;
}

function countExternalLinks(html: string, baseUrl: string): number {
  const domain = new URL(baseUrl).hostname;
  const linkRegex = /<a[^>]*href=['"]([^'"]*?)['"][^>]*>/gs;
  const matches = html.match(linkRegex) || [];
  
  return matches.filter(match => {
    const hrefMatch = match.match(/href=['"]([^'"]*?)['"]/)!;
    const href = hrefMatch[1];
    
    if (href.startsWith('http')) {
      try {
        return new URL(href).hostname !== domain;
      } catch {
        return false;
      }
    }
    return false;
  }).length;
}

function countWords(html: string): number {
  // Remove scripts, styles, and other non-content elements
  const cleanHtml = html
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleanHtml ? cleanHtml.split(' ').length : 0;
}