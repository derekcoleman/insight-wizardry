
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  adsAccounts: Account[];
  conversionGoals: ConversionGoal[];
  isLoading: boolean;
  error: string | null;
  gaConnected: boolean;
  gscConnected: boolean;
  adsConnected: boolean;
  handleLogin: () => void;
  fetchConversionGoals: (propertyId: string) => Promise<void>;
  accessToken: string | null;
}

export function useGoogleServices(): UseGoogleServicesReturn {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [adsAccounts, setAdsAccounts] = useState<Account[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [adsConnected, setAdsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApiError = (error: any, apiName: string) => {
    console.error(`${apiName} API Error:`, error);
    let errorMessage = error?.message || "An unknown error occurred";
    let detailedError = "";

    if (error.response) {
      console.error(`${apiName} API Response Error:`, {
        status: error.response.status,
        data: error.response.data,
      });
      
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
      console.error(`${apiName} API Request Error:`, error.request);
      errorMessage = `No response received from ${apiName} API.`;
      detailedError = "Please check your internet connection.";
    }

    console.error(`${apiName} Final Error:`, { errorMessage, detailedError });

    if (apiName !== "Google Ads") {
      // Only set global error for non-Ads APIs
      setError(`${errorMessage}\n${detailedError}`);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      // For Ads, just show a toast but don't block the app
      console.warn("Google Ads not available - continuing without it");
      toast({
        title: "Notice",
        description: "Google Ads data will not be available. You can continue with Analytics and Search Console.",
      });
    }
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
      
      // Fetch all available events
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateRanges: [{
              startDate: '30daysAgo',
              endDate: 'today',
            }],
            dimensions: [
              { name: 'eventName' },
            ],
            metrics: [
              { name: 'eventCount' },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GA4 API Error Response:", errorText);
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
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

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);
      setAccessToken(response.access_token);
      
      try {
        setGaAccounts([]);
        setGscAccounts([]);
        setAdsAccounts([]);
        setConversionGoals([]);
        setGaConnected(false);
        setGscConnected(false);
        setAdsConnected(false);

        // Fetch GA4 accounts
        try {
          console.log("Fetching GA4 accounts...");
          const gaResponse = await fetch(
            "https://analyticsadmin.googleapis.com/v1alpha/accounts",
            {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            }
          );

          if (!gaResponse.ok) {
            throw new Error(`GA4 API error: ${gaResponse.statusText}`);
          }

          const gaData = await gaResponse.json();
          console.log("GA4 Response:", gaData);

          if (!gaData.accounts || gaData.accounts.length === 0) {
            throw new Error("No GA4 accounts found");
          }

          console.log("Fetching GA4 properties for all accounts...");
          const allProperties = [];
          
          for (const account of gaData.accounts) {
            const propertiesResponse = await fetch(
              `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
              {
                headers: {
                  Authorization: `Bearer ${response.access_token}`,
                },
              }
            );

            if (!propertiesResponse.ok) {
              console.warn(`Failed to fetch properties for account ${account.name}`);
              continue;
            }

            const propertiesData = await propertiesResponse.json();
            if (propertiesData.properties) {
              allProperties.push(...propertiesData.properties);
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
          
          setGaAccounts(
            allProperties.map((p: any) => ({
              id: p.name,
              name: p.displayName,
            }))
          );
        } catch (error: any) {
          handleApiError(error, "Google Analytics");
        }

        // Fetch Search Console sites
        try {
          console.log("Fetching Search Console sites...");
          const gscResponse = await fetch(
            "https://www.googleapis.com/webmasters/v3/sites",
            {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            }
          );

          if (!gscResponse.ok) {
            throw new Error(`Search Console API error: ${gscResponse.statusText}`);
          }

          const gscData = await gscResponse.json();
          console.log("Search Console Response:", gscData);
          
          if (!gscData.siteEntry || gscData.siteEntry.length === 0) {
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
          
          setGscAccounts(
            gscData.siteEntry?.map((s: any) => ({
              id: s.siteUrl,
              name: s.siteUrl,
            })) || []
          );
        } catch (error: any) {
          handleApiError(error, "Search Console");
        }

        // Fetch Google Ads accounts through our Edge Function
        try {
          console.log("Fetching Google Ads accounts through Edge Function...");
          console.log("Access Token:", response.access_token.substring(0, 10) + "...");
          
          const { data: adsData, error: adsError } = await supabase.functions.invoke('google-ads-proxy', {
            body: { 
              accessToken: response.access_token 
            }
          });

          if (adsError) {
            console.error("Edge Function Error:", adsError);
            throw new Error(adsError.message || "Failed to fetch Google Ads accounts");
          }

          console.log("Google Ads Edge Function Response:", adsData);

          if (!adsData) {
            console.warn("No data in response");
            throw new Error("Invalid response from Google Ads proxy");
          }

          if (adsData.error) {
            console.error("Google Ads API Error:", adsData.error);
            throw new Error(adsData.error);
          }

          if (!adsData.accounts) {
            console.warn("No accounts data in response:", adsData);
            throw new Error("Invalid response format from Google Ads proxy");
          }

          if (adsData.accounts.length === 0) {
            toast({
              title: "Warning",
              description: "No Google Ads accounts found",
              variant: "destructive",
            });
          } else {
            setAdsConnected(true);
            toast({
              title: "Success",
              description: "Connected to Google Ads",
            });
            setAdsAccounts(adsData.accounts);
          }
        } catch (error: any) {
          console.error("Google Ads API Error:", error);
          // Handle Ads error differently - don't block the entire flow
          handleApiError(error, "Google Ads");
        }

      } catch (error: any) {
        handleApiError(error, "Google Services");
      } finally {
        setIsLoading(false);
      }
    },
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics",
      "https://www.googleapis.com/auth/analytics.edit",
      "https://www.googleapis.com/auth/adwords"
    ].join(" "),
    flow: "implicit"
  });

  return {
    gaAccounts,
    gscAccounts,
    adsAccounts,
    conversionGoals,
    isLoading,
    error,
    gaConnected,
    gscConnected,
    adsConnected,
    handleLogin: () => login(),
    fetchConversionGoals,
    accessToken,
  };
}
