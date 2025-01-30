import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface Account {
  id: string;
  name: string;
}

interface ConversionGoal {
  id: string;
  name: string;
}

interface GoogleOAuthData {
  access_token: string;
  email: string;
}

export function useGoogleServices() {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  // Load stored OAuth data on mount
  useEffect(() => {
    const loadStoredOAuthData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('google_oauth_data')
            .eq('id', session.user.id)
            .single();

          if (profile?.google_oauth_data) {
            // First cast to unknown, then to GoogleOAuthData to satisfy TypeScript
            const oauthData = profile.google_oauth_data as unknown as GoogleOAuthData;
            if (oauthData.access_token) {
              setAccessToken(oauthData.access_token);
              setUserEmail(oauthData.email);
              await signInWithGoogle(oauthData.access_token);
            }
          }
        }
      } catch (error) {
        console.error('Error loading stored OAuth data:', error);
      }
    };

    loadStoredOAuthData();
  }, []);

  const handleApiError = (error: any, apiName: string) => {
    console.error(`${apiName} API Error:`, error);
    const errorMessage = error.response?.data?.error?.message || error.message || "An unknown error occurred";
    setError(`${apiName} API error: ${errorMessage}`);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const signInWithGoogle = async (googleAccessToken: string) => {
    try {
      console.log("Starting Google OAuth flow");
      setAccessToken(googleAccessToken);

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();
      console.log("Received user info:", { email: userInfo.email });
      setUserEmail(userInfo.email);

      // Store OAuth data in Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const oauthData: Record<string, Json> = {
          access_token: googleAccessToken,
          email: userInfo.email
        };

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            google_oauth_data: oauthData
          })
          .eq('id', session.user.id);

        if (updateError) throw updateError;
      }

      // Test Gmail connection
      const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
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
            Authorization: `Bearer ${googleAccessToken}`,
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
                Authorization: `Bearer ${googleAccessToken}`,
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
            Authorization: `Bearer ${googleAccessToken}`,
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

    } catch (error: any) {
      console.error('Error in signInWithGoogle:', error);
      handleApiError(error, "Google Services");
    }
  };

  const fetchConversionGoals = async (propertyId: string) => {
    if (!accessToken) {
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
      handleApiError(error, "Google Analytics");
      setConversionGoals([]);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Google login successful, token:", response.access_token);
        await signInWithGoogle(response.access_token);
      } catch (error: any) {
        console.error("Login error:", error);
        handleApiError(error, "Google Services");
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

  return {
    gaAccounts,
    gscAccounts,
    conversionGoals,
    isLoading,
    error,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin: () => login(),
    fetchConversionGoals,
    accessToken,
    userEmail,
  };
}
