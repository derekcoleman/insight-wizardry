import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoogleAccount, ConversionGoal, GoogleOAuthData } from "@/types/google";

export function useGoogleServices() {
  const [gaAccounts, setGaAccounts] = useState<GoogleAccount[]>([]);
  const [gscAccounts, setGscAccounts] = useState<GoogleAccount[]>([]);
  const [conversionGoals, setConversionGoals] = useState<ConversionGoal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  // Load persisted OAuth data on mount
  useEffect(() => {
    const loadPersistedAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('google_oauth_data')
          .eq('id', session.user.id)
          .single();

        if (profile?.google_oauth_data) {
          const oauthData = profile.google_oauth_data as GoogleOAuthData;
          if (oauthData.access_token) {
            setAccessToken(oauthData.access_token);
            setUserEmail(oauthData.email);
            await fetchGoogleServices(oauthData.access_token);
          }
        }
      } catch (error) {
        console.error('Error loading persisted auth:', error);
      }
    };

    loadPersistedAuth();
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

  const fetchGoogleServices = async (token: string) => {
    try {
      const [userInfo, gaResponse, gscResponse, gmailResponse] = await Promise.all([
        fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.json()),
        fetch("https://analyticsadmin.googleapis.com/v1alpha/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.json()),
        fetch("https://www.googleapis.com/webmasters/v3/sites", {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.json()),
        fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok)
      ]);

      setUserEmail(userInfo.email);

      // Process GA4 accounts
      if (gaResponse.accounts?.length > 0) {
        setGaConnected(true);
        const propertiesPromises = gaResponse.accounts.map((account: any) =>
          fetch(
            `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then(res => res.json())
        );

        const propertiesResponses = await Promise.all(propertiesPromises);
        const allProperties = propertiesResponses.flatMap(response => 
          response.properties || []
        );

        setGaAccounts(allProperties.map((p: any) => ({
          id: p.name,
          name: p.displayName,
        })));

        toast({
          title: "Success",
          description: "Connected to Google Analytics 4",
        });
      }

      // Process Search Console sites
      if (gscResponse.siteEntry?.length > 0) {
        setGscConnected(true);
        setGscAccounts(gscResponse.siteEntry.map((s: any) => ({
          id: s.siteUrl,
          name: s.siteUrl,
        })));
        toast({
          title: "Success",
          description: "Connected to Search Console",
        });
      }

      // Process Gmail connection
      if (gmailResponse) {
        setGmailConnected(true);
        toast({
          title: "Success",
          description: "Connected to Gmail",
        });
      }

      // Save OAuth data to profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const oauthData: GoogleOAuthData = {
          access_token: token,
          email: userInfo.email,
          timestamp: Date.now()
        };

        await supabase
          .from('profiles')
          .update({ google_oauth_data: oauthData })
          .eq('id', session.user.id);
      }

    } catch (error) {
      console.error('Error in fetchGoogleServices:', error);
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
    } catch (error) {
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
        setAccessToken(response.access_token);
        await fetchGoogleServices(response.access_token);
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