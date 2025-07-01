
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    console.log('Crawling sitemap for domain:', domain);

    if (!domain) {
      throw new Error('Domain is required');
    }

    // Try common sitemap locations
    const sitemapUrls = [
      `${domain}/sitemap.xml`,
      `${domain}/sitemap_index.xml`,
      `${domain}/sitemap/sitemap.xml`,
      `${domain}/wp-sitemap.xml`
    ];

    let sitemapContent = '';
    let foundSitemapUrl = '';

    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log('Trying sitemap URL:', sitemapUrl);
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          sitemapContent = await response.text();
          foundSitemapUrl = sitemapUrl;
          console.log('Found sitemap at:', sitemapUrl);
          break;
        }
      } catch (error) {
        console.log('Failed to fetch sitemap from:', sitemapUrl, error);
        continue;
      }
    }

    if (!sitemapContent) {
      throw new Error('No sitemap found at common locations');
    }

    // Parse XML sitemap using regex-based approach (Deno-compatible)
    const allEntries: SitemapEntry[] = [];
    
    // Check if this is a sitemap index
    const sitemapIndexRegex = /<sitemapindex[^>]*>[\s\S]*?<\/sitemapindex>/i;
    const isSitemapIndex = sitemapIndexRegex.test(sitemapContent);

    if (isSitemapIndex) {
      // Extract individual sitemap URLs from sitemap index
      const sitemapLocationRegex = /<sitemap[^>]*>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/gi;
      const sitemapMatches = Array.from(sitemapContent.matchAll(sitemapLocationRegex));
      
      console.log('Found sitemap index with', sitemapMatches.length, 'sitemaps');
      
      for (const match of sitemapMatches) {
        const sitemapLoc = match[1];
        if (sitemapLoc) {
          try {
            const response = await fetch(sitemapLoc);
            if (response.ok) {
              const individualSitemapContent = await response.text();
              const urls = parseUrlsFromSitemap(individualSitemapContent);
              allEntries.push(...urls);
            }
          } catch (error) {
            console.log('Failed to fetch individual sitemap:', sitemapLoc, error);
          }
        }
      }
    } else {
      // This is a regular sitemap
      allEntries.push(...parseUrlsFromSitemap(sitemapContent));
    }

    console.log('Total URLs found:', allEntries.length);

    return new Response(
      JSON.stringify({ 
        sitemapUrl: foundSitemapUrl,
        entries: allEntries,
        totalUrls: allEntries.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crawl-sitemap function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function parseUrlsFromSitemap(xmlContent: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  
  // Extract URLs using regex
  const urlRegex = /<url[^>]*>([\s\S]*?)<\/url>/gi;
  const urlMatches = Array.from(xmlContent.matchAll(urlRegex));
  
  for (const urlMatch of urlMatches) {
    const urlContent = urlMatch[1];
    
    // Extract individual elements
    const locMatch = urlContent.match(/<loc>(.*?)<\/loc>/i);
    const lastmodMatch = urlContent.match(/<lastmod>(.*?)<\/lastmod>/i);
    const changefreqMatch = urlContent.match(/<changefreq>(.*?)<\/changefreq>/i);
    const priorityMatch = urlContent.match(/<priority>(.*?)<\/priority>/i);
    
    if (locMatch && locMatch[1]) {
      entries.push({
        url: locMatch[1].trim(),
        lastmod: lastmodMatch ? lastmodMatch[1].trim() : undefined,
        changefreq: changefreqMatch ? changefreqMatch[1].trim() : undefined,
        priority: priorityMatch ? priorityMatch[1].trim() : undefined
      });
    }
  }
  
  return entries;
}
