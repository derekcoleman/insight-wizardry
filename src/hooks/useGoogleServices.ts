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
}

export function useGoogleServices(): UseGoogleServicesReturn {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string>("");
  const { toast } = useToast();

  const handleApiError = (error: any, apiName: string) => {
    console.error(`${apiName} API Error:`, error);
    let errorMessage = "An unknown error occurred";
    let detailedError = "";

    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);

      if (error.response.status === 403) {
        if (error.response.data?.error?.reason === "accessNotConfigured") {
          errorMessage = `${apiName} API is not enabled.`;
          detailedError = `Please follow these steps:
          1. Go to Google Cloud Console
          2. Enable the ${apiName} API at: ${error.response.data?.error?.details?.[0]?.metadata?.activationUrl || 'https://console.cloud.google.com'}
          3. Wait a few minutes for changes to propagate
          4. Try connecting again`;
        } else {
          errorMessage = `Access denied to ${apiName}. Please check:`;
          detailedError = `
            1. The ${apiName} API is enabled in your Google Cloud Console
            2. Your account has the necessary permissions
            3. You've granted all required OAuth scopes during login
          `;
          if (apiName === "Search Console") {
            detailedError += "\n4. You have verified ownership of the sites in Search Console";
          }
        }
      } else if (error.response.status === 401) {
        errorMessage = `Authentication failed for ${apiName}.`;
        detailedError = "Please try logging in again or check if your Google Cloud project is properly configured.";
      } else if (error.response.status === 404) {
        errorMessage = `${apiName} resource not found.`;
        if (apiName === "Search Console") {
          detailedError = "Please verify that you have sites added and verified in your Search Console account.";
        } else {
          detailedError = "Please verify that you have GA4 properties set up in your Google Analytics account.";
        }
      } else if (error.response.status === 429) {
        errorMessage = `Too many requests to ${apiName}.`;
        detailedError = "Please wait a few minutes and try again.";
      } else {
        errorMessage = `${apiName} API error: ${error.response.status} - ${error.response.statusText}`;
        detailedError = error.response.data?.error?.message || "No additional error details available.";
      }
    } else if (error.request) {
      console.error('Error Request:', error.request);
      errorMessage = `No response received from ${apiName} API.`;
      detailedError = "Please check your internet connection and try again.";
    } else {
      console.error('Error Message:', error.message);
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
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/${propertyId}/metadata`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch conversion goals: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Metadata response:", data);
      
      if (!data.metrics) {
        console.log("No metrics found in response");
        setConversionGoals([]);
        return;
      }

      const goals = data.metrics
        .filter((metric: any) => {
          if (!metric || typeof metric !== 'object') return false;
          const metricName = metric.name || '';
          return metricName.toLowerCase().includes('conversion') || 
                 metricName.toLowerCase().includes('goal') ||
                 metricName.toLowerCase().includes('event');
        })
        .map((metric: any) => ({
          id: metric.name || '',
          name: metric.displayName || metric.name || 'Unnamed Goal',
        }));

      console.log("Fetched conversion goals:", goals);
      setConversionGoals(goals);
    } catch (error) {
      console.error("Error fetching conversion goals:", error);
      handleApiError(error, "Google Analytics");
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);
      setAccessToken(response.access_token);
      
      try {
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
            const errorData = await gaResponse.json().catch(() => ({}));
            console.error("GA4 Error Response:", errorData);
            throw new Error(`GA4 API error: ${gaResponse.statusText}\n${JSON.stringify(errorData, null, 2)}`);
          }

          const gaData = await gaResponse.json();
          console.log("GA4 Response:", gaData);

          if (!gaData.accounts || gaData.accounts.length === 0) {
            throw new Error("No GA4 accounts found. Please make sure you have access to GA4 accounts.");
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
              console.warn(`Failed to fetch properties for account ${account.name}:`, await propertiesResponse.json());
              continue;
            }

            const propertiesData = await propertiesResponse.json();
            if (propertiesData.properties) {
              allProperties.push(...propertiesData.properties);
            }
          }

          console.log("All GA4 Properties Response:", allProperties);
          
          if (allProperties.length === 0) {
            console.log("No GA4 properties found");
            toast({
              title: "Warning",
              description: "No Google Analytics 4 properties found for your accounts. Please make sure you have access to GA4 properties.",
              variant: "destructive",
            });
          } else {
            setGaConnected(true);
            toast({
              title: "Success",
              description: "Successfully connected to Google Analytics 4",
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
            const errorData = await gscResponse.json().catch(() => ({}));
            console.error("Search Console Error Response:", errorData);
            throw new Error(`Search Console API error: ${gscResponse.statusText}\n${JSON.stringify(errorData, null, 2)}`);
          }

          const gscData = await gscResponse.json();
          console.log("Search Console Response:", gscData);
          
          if (!gscData.siteEntry || gscData.siteEntry.length === 0) {
            console.log("No Search Console sites found");
            toast({
              title: "Warning",
              description: "No Search Console sites found for your account. Please verify that you have:"+
                          "\n1. Added and verified your sites in Search Console"+
                          "\n2. Proper access permissions to the sites",
              variant: "destructive",
            });
          } else {
            setGscConnected(true);
            toast({
              title: "Success",
              description: "Successfully connected to Search Console",
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
  };
}