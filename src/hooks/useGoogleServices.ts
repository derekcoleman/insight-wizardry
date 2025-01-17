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
}

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
      console.log("No access token available for fetching conversion goals");
      return;
    }

    try {
      console.log("Fetching conversion goals for property:", propertyId);
      
      // Clean up the property ID by removing 'properties/' prefix if present
      const cleanPropertyId = propertyId.replace(/^properties\//, '');
      console.log("Clean property ID:", cleanPropertyId);
      
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}/metadata`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GA4 API Error Response:", errorText);
        throw new Error(`Failed to fetch conversion goals: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Metadata response:", data);
      
      if (!data.metrics) {
        console.log("No metrics found in response");
        setConversionGoals([]);
        return;
      }

      // Filter and map conversion-related metrics
      const goals = data.metrics
        .filter((metric: any) => {
          const name = (metric.name || '').toLowerCase();
          const displayName = (metric.displayName || '').toLowerCase();
          return (
            name.includes('conversions') ||
            name.includes('event_count') ||
            displayName.includes('conversion') ||
            displayName.includes('goal') ||
            displayName.includes('purchase') ||
            displayName.includes('transaction')
          );
        })
        .map((metric: any) => ({
          id: metric.name,
          name: metric.displayName || metric.name,
        }));

      console.log("Filtered conversion goals:", goals);
      setConversionGoals(goals);
      
      if (goals.length === 0) {
        toast({
          title: "No conversion goals found",
          description: "No conversion goals were found for this property",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching conversion goals:", error);
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
        // Reset states before fetching new data
        setGaAccounts([]);
        setGscAccounts([]);
        setConversionGoals([]);
        setGaConnected(false);
        setGscConnected(false);

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

          // Fetch properties for all accounts
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

      } catch (error: any) {
        handleApiError(error, "Google Analytics");
      } finally {
        setIsLoading(false);
      }
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
  };
}