import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: string;
  name: string;
}

interface ConversionGoal {
  id: string;
  name: string;
}

interface GoogleLoginResult {
  token: string;
  email: string;
}

export function useGoogleServices(existingToken?: string | null) {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const { toast } = useToast();

  const fetchGoogleData = async (token: string): Promise<GoogleLoginResult> => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();
      console.log("Received user info:", { email: userInfo.email });

      // Test Gmail connection
      const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (gmailResponse.ok) {
        setGmailConnected(true);
        toast({
          title: "Success",
          description: "Connected to Gmail",
        });
      }

      // Fetch GA4 accounts
      const gaResponse = await fetch(
        "https://analyticsadmin.googleapis.com/v1alpha/accounts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!gaResponse.ok) {
        throw new Error(`GA4 API error: ${gaResponse.statusText}`);
      }

      const gaData = await gaResponse.json();
      console.log("GA4 Response:", gaData);

      if (gaData.accounts?.length > 0) {
        setGaConnected(true);
        toast({
          title: "Success",
          description: "Connected to Google Analytics 4",
        });

        // Fetch GA4 properties for all accounts
        const allProperties = [];
        for (const account of gaData.accounts) {
          const propertiesResponse = await fetch(
            `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json();
            if (propertiesData.properties) {
              allProperties.push(...propertiesData.properties);
            }
          }
        }

        setGaAccounts(
          allProperties.map((p: any) => ({
            id: p.name,
            name: p.displayName,
          }))
        );
      }

      // Fetch Search Console sites
      const gscResponse = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!gscResponse.ok) {
        throw new Error(`Search Console API error: ${gscResponse.statusText}`);
      }

      const gscData = await gscResponse.json();
      console.log("Search Console Response:", gscData);
      
      if (gscData.siteEntry?.length > 0) {
        setGscConnected(true);
        toast({
          title: "Success",
          description: "Connected to Search Console",
        });
        
        setGscAccounts(
          gscData.siteEntry.map((s: any) => ({
            id: s.siteUrl,
            name: s.siteUrl,
          }))
        );
      }

      return { token, email: userInfo.email };
    } catch (error: any) {
      console.error('Error fetching Google data:', error);
      throw error;
    }
  };

  const handleLogin = async (): Promise<GoogleLoginResult | null> => {
    if (existingToken) {
      try {
        return await fetchGoogleData(existingToken);
      } catch (error: any) {
        console.error("Error using existing token:", error);
        setError(error.message);
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      const login = useGoogleLogin({
        onSuccess: async (response) => {
          setIsLoading(true);
          setError(null);
          
          try {
            const result = await fetchGoogleData(response.access_token);
            resolve(result);
          } catch (error: any) {
            console.error("Login error:", error);
            setError(error.message);
            reject(error);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (errorResponse) => {
          console.error("Google login error:", errorResponse);
          const errorMessage = errorResponse.error_description || errorResponse.error || "Failed to authenticate with Google";
          setError(errorMessage);
          toast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive",
          });
          reject(errorResponse);
        },
        scope: [
          "https://www.googleapis.com/auth/analytics.readonly",
          "https://www.googleapis.com/auth/webmasters.readonly",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/userinfo.profile"
        ].join(" "),
        flow: "implicit",
        prompt: "consent",
      });

      login();
    });
  };

  const fetchConversionGoals = async (propertyId: string) => {
    if (!existingToken) {
      console.log("No access token available for fetching events");
      return;
    }

    try {
      const cleanPropertyId = propertyId.replace(/^properties\//, '');
      
      const response = await fetch(
        `https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropertyId}:runReport`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${existingToken}`,
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
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Events data response:", data);

      const uniqueEvents = new Set<string>();
      data.rows?.forEach((row: any) => {
        const eventName = row.dimensionValues?.[0]?.value;
        if (eventName) {
          uniqueEvents.add(eventName);
        }
      });

      const eventsList = Array.from(uniqueEvents).sort();
      
      const goals = [
        { id: 'Total Events', name: 'Total Events' },
        ...eventsList.map(event => ({
          id: event,
          name: event
        }))
      ];

      setConversionGoals(goals);
      
      if (goals.length > 1) {
        toast({
          title: "Events Found",
          description: `Found ${goals.length - 1} events in this GA4 property`,
        });
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      setError(error.message);
      setConversionGoals([]);
    }
  };

  return {
    gaAccounts,
    gscAccounts,
    conversionGoals,
    isLoading,
    error,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin,
    fetchConversionGoals,
  };
}
