
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapData {
  sitemapUrl: string;
  entries: SitemapEntry[];
  totalUrls: number;
}

export function useSitemapCrawler() {
  const [isLoading, setIsLoading] = useState(false);
  const [sitemapData, setSitemapData] = useState<SitemapData | null>(null);
  const { toast } = useToast();

  const crawlSitemap = async (domain: string) => {
    setIsLoading(true);
    try {
      console.log('Crawling sitemap for domain:', domain);
      
      const { data, error } = await supabase.functions.invoke('crawl-sitemap', {
        body: { domain }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSitemapData(data);
      
      toast({
        title: "Sitemap Crawled Successfully",
        description: `Found ${data.totalUrls} URLs in sitemap`,
      });

      return data;
    } catch (error) {
      console.error('Error crawling sitemap:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to crawl sitemap",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPageLastModified = (pageUrl: string): string | null => {
    if (!sitemapData) return null;
    
    const entry = sitemapData.entries.find(entry => entry.url === pageUrl);
    return entry?.lastmod || null;
  };

  const getOutdatedPages = (months: number = 10): SitemapEntry[] => {
    if (!sitemapData) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    return sitemapData.entries.filter(entry => {
      if (!entry.lastmod) return true; // No lastmod means potentially outdated
      
      const lastModified = new Date(entry.lastmod);
      return lastModified < cutoffDate;
    });
  };

  return {
    crawlSitemap,
    getPageLastModified,
    getOutdatedPages,
    sitemapData,
    isLoading
  };
}
