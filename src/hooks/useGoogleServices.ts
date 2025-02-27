
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/components/ui/use-toast";

interface Account {
  id: string;
  name: string;
}

interface ConversionGoal {
  id: string;
  name: string;
}

interface UseGoogleServicesReturn {
  gaAccounts: Account[];
  gscAccounts: Account[];
  conversionGoals: ConversionGoal[];
  isLoading: boolean;
  error: string | null;
  gaConnected: boolean;
  gscConnected: boolean;
  handleLogin: () => void;
  fetchConversionGoals: (propertyId: string) => Promise<void>;
  accessToken: string | null;
  refreshAccounts: () => void;
}

const formatEventName = (eventName: string): string => {
  return eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function useGoogleServices(): UseGoogleServicesReturn {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApiError = (error: any, apiName: string) => {
    console.error(`${apiName} API Error:`, error);
    let errorMessage = "An unknown error occurred";
    let detailedError = "";

    if (error.response) {
      if (error.response.status === 403) {
        errorMessage = `${apiName} API is not enabled.`;
        detailedError = `Please enable the ${apiName} API in Google Cloud Console`;
      } else if (error.response.status === 401) {
        errorMessage = `Authentication failed for ${apiName}.`;
        detailedError = "Please try logging in again.";
      } else {
        errorMessage = `${apiName} API error: ${error.response.status}`;
        detailedError = error.response.data?.error?.message || "No additional error details available.";
      }
    } else if (error.request) {
      errorMessage = `No response received from ${apiName} API.`;
      detailedError = "Please check your internet connection.";
    } else {
      errorMessage = `Error accessing ${apiName}`;
      detailedError = error.message || "An unexpected error occurred.";
    }

    setError(`${errorMessage}\n${detailedError}`);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const fetchConversionGoals = async (propertyId: string) => {
    if (!accessToken) {
      console.log("No access token available for fetching events");
      return;
    }

    try {
      console.log("Fetching events for property:", propertyId);
      
      const cleanPropertyId = propertyId.replace(/^properties\//, '');
      console.log("Clean property ID:", cleanPropertyId);
      
      // Use the Edge Function to proxy the request to avoid CORS
      const { data, error } = await fetch(`/api/proxy/ga4/events?propertyId=${cleanPropertyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      }).then(response => response.json());
      
      if (error) {
        throw new Error(error);
      }
      
      console.log("Events data response:", data);

      // Extract unique event names and sort them
      const uniqueEvents = new Set<string>();
      data.rows?.forEach((row: any) => {
        const eventName = row.dimensionValues?.[0]?.value;
        if (eventName) {
          uniqueEvents.add(eventName);
        }
      });

      const eventsList = Array.from(uniqueEvents).sort();
      
      // Create the goals list with Total Events as the first option and format event names
      const goals = [
        { id: 'Total Events', name: 'Total Events' },
        ...eventsList.map(event => ({
          id: event,
          name: event
        }))
      ];

      console.log("Available events:", goals);
      setConversionGoals(goals);
      
      if (goals.length === 0) {
        toast({
          title: "No Events Found",
          description: "No events were found in this GA4 property",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Events Found",
          description: `Found ${goals.length - 1} events in this GA4 property`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      handleApiError(error, "Google Analytics");
      setConversionGoals([]);
    }
  };

  const fetchAccountData = async (token: string) => {
    setIsLoading(true);
    setError(null);
    setAccessToken(token);
    
    try {
      // Clear previous data
      setGaAccounts([]);
      setGscAccounts([]);
      setConversionGoals([]);
      setGaConnected(false);
      setGscConnected(false);

      try {
        console.log("Fetching GA4 accounts...");
        
        // Use Supabase Edge Function as a proxy to avoid CORS issues
        const result = await fetch('/api/proxy/ga4/accounts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).then(response => response.json());
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log("GA4 Response:", result.data);
        
        if (!result.data.accounts || result.data.accounts.length === 0) {
          throw new Error("No GA4 accounts found");
        }
        
        // Fetch GA4 properties
        const allProperties = [];
        for (const account of result.data.accounts) {
          const propertiesResult = await fetch(`/api/proxy/ga4/properties?accountId=${account.name}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }).then(response => response.json());
          
          if (propertiesResult.error) {
            console.warn(`Failed to fetch properties for account ${account.name}: ${propertiesResult.error}`);
            continue;
          }
          
          if (propertiesResult.data.properties) {
            allProperties.push(...propertiesResult.data.properties);
          }
        }
        
        console.log("All GA4 Properties Response:", allProperties);
        
        if (allProperties.length === 0) {
          toast({
            title: "Warning",
            description: "No Google Analytics 4 properties found",
            variant: "destructive",
          });
        } else {
          setGaConnected(true);
          toast({
            title: "Success",
            description: "Connected to Google Analytics 4",
          });
        }
        
        // Sort properties alphabetically by name
        const sortedProperties = allProperties
          .map((p: any) => ({
            id: p.name,
            name: p.displayName,
          }))
          .sort((a: Account, b: Account) => a.name.localeCompare(b.name));
        
        setGaAccounts(sortedProperties);
      } catch (error: any) {
        handleApiError(error, "Google Analytics");
      }

      try {
        console.log("Fetching Search Console sites...");
        
        // Use Supabase Edge Function as a proxy to avoid CORS issues
        const result = await fetch('/api/proxy/gsc/sites', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }).then(response => response.json());
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log("Search Console Response:", result.data);
        
        if (!result.data.siteEntry || result.data.siteEntry.length === 0) {
          toast({
            title: "Warning",
            description: "No Search Console sites found",
            variant: "destructive",
          });
        } else {
          setGscConnected(true);
          toast({
            title: "Success",
            description: "Connected to Search Console",
          });
        }
        
        // Sort sites alphabetically
        const sortedSites = (result.data.siteEntry?.map((s: any) => ({
          id: s.siteUrl,
          name: s.siteUrl,
        })) || []).sort((a: Account, b: Account) => a.name.localeCompare(b.name));
        
        setGscAccounts(sortedSites);
      } catch (error: any) {
        handleApiError(error, "Search Console");
      }

    } catch (error: any) {
      handleApiError(error, "Google Analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccounts = () => {
    if (accessToken) {
      console.log("Refreshing accounts with token:", accessToken);
      fetchAccountData(accessToken);
      
      toast({
        title: "Refreshing",
        description: "Fetching the latest properties from Google...",
      });
    } else {
      toast({
        title: "Not Connected",
        description: "Please login to Google first",
        variant: "destructive",
      });
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      await fetchAccountData(response.access_token);
    },
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics",
      "https://www.googleapis.com/auth/analytics.edit"
    ].join(" "),
    flow: "implicit"
  });

  return {
    gaAccounts,
    gscAccounts,
    conversionGoals,
    isLoading,
    error,
    gaConnected,
    gscConnected,
    handleLogin: () => login(),
    fetchConversionGoals,
    accessToken,
    refreshAccounts,
  };
}
