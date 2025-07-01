
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CacheConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
}

interface AnalyticsParams {
  ga4Property: string;
  gscProperty?: string;
  accessToken: string;
  mainConversionGoal?: string;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
};

export function useAnalyticsCache() {
  const queryClient = useQueryClient();

  const analyzeData = (params: AnalyticsParams, config: CacheConfig = {}) => {
    const mergedConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    return useQuery({
      queryKey: ['analytics', params.ga4Property, params.gscProperty, params.mainConversionGoal],
      queryFn: async () => {
        console.log('Fetching analytics data from API...');
        const result = await supabase.functions.invoke('analyze-ga4-data', {
          body: params,
        });

        if (result.error) {
          throw new Error(result.error.message || 'Failed to analyze data');
        }

        return result.data;
      },
      staleTime: mergedConfig.staleTime,
      gcTime: mergedConfig.cacheTime,
      refetchOnWindowFocus: mergedConfig.refetchOnWindowFocus,
      refetchOnMount: mergedConfig.refetchOnMount,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  const generateInsights = (reportData: any, config: CacheConfig = {}) => {
    const mergedConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    return useQuery({
      queryKey: ['insights', JSON.stringify(reportData)],
      queryFn: async () => {
        console.log('Generating insights from cached data...');
        const result = await supabase.functions.invoke('generate-insights', {
          body: { data: reportData }
        });

        if (result.error) {
          throw new Error(result.error.message || 'Failed to generate insights');
        }

        return result.data.insights;
      },
      enabled: !!reportData,
      staleTime: mergedConfig.staleTime,
      gcTime: mergedConfig.cacheTime,
      refetchOnWindowFocus: mergedConfig.refetchOnWindowFocus,
      refetchOnMount: mergedConfig.refetchOnMount,
    });
  };

  const invalidateAnalytics = (ga4Property?: string) => {
    if (ga4Property) {
      queryClient.invalidateQueries({ queryKey: ['analytics', ga4Property] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  };

  const invalidateInsights = () => {
    queryClient.invalidateQueries({ queryKey: ['insights'] });
  };

  const prefetchAnalytics = async (params: AnalyticsParams) => {
    await queryClient.prefetchQuery({
      queryKey: ['analytics', params.ga4Property, params.gscProperty, params.mainConversionGoal],
      queryFn: async () => {
        const result = await supabase.functions.invoke('analyze-ga4-data', {
          body: params,
        });
        return result.data;
      },
      staleTime: DEFAULT_CACHE_CONFIG.staleTime,
    });
  };

  return {
    analyzeData,
    generateInsights,
    invalidateAnalytics,
    invalidateInsights,
    prefetchAnalytics,
  };
}
