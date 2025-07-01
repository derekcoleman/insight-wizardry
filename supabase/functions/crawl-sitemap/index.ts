
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

    // Parse XML sitemap
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sitemapContent, 'text/xml');
    
    // Check if this is a sitemap index
    const sitemapIndexEntries = xmlDoc.querySelectorAll('sitemapindex > sitemap');
    let allEntries: SitemapEntry[] = [];

    if (sitemapIndexEntries.length > 0) {
      // This is a sitemap index, fetch individual sitemaps
      console.log('Found sitemap index with', sitemapIndexEntries.length, 'sitemaps');
      
      for (const sitemapEntry of Array.from(sitemapIndexEntries)) {
        const sitemapLoc = sitemapEntry.querySelector('loc')?.textContent;
        if (sitemapLoc) {
          try {
            const response = await fetch(sitemapLoc);
            if (response.ok) {
              const individualSitemapContent = await response.text();
              const individualXmlDoc = parser.parseFromString(individualSitemapContent, 'text/xml');
              const urls = parseUrlsFromSitemap(individualXmlDoc);
              allEntries.push(...urls);
            }
          } catch (error) {
            console.log('Failed to fetch individual sitemap:', sitemapLoc, error);
          }
        }
      }
    } else {
      // This is a regular sitemap
      allEntries = parseUrlsFromSitemap(xmlDoc);
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

function parseUrlsFromSitemap(xmlDoc: Document): SitemapEntry[] {
  const urls = xmlDoc.querySelectorAll('urlset > url');
  return Array.from(urls).map(url => {
    const loc = url.querySelector('loc')?.textContent;
    const lastmod = url.querySelector('lastmod')?.textContent;
    const changefreq = url.querySelector('changefreq')?.textContent;
    const priority = url.querySelector('priority')?.textContent;

    return {
      url: loc || '',
      lastmod,
      changefreq,
      priority
    };
  }).filter(entry => entry.url);
}
