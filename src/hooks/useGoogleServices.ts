import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/hooks/use-toast";
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
  conversionGoals: ConversionGoal[];
  isLoading: boolean;
  error: string | null;
  gaConnected: boolean;
  gscConnected: boolean;
  gmailConnected: boolean;
  handleLogin: () => void;
  fetchConversionGoals: (propertyId: string) => Promise<void>;
  accessToken: string | null;
  userEmail: string | null;
}

export function useGoogleServices(): UseGoogleServicesReturn {
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

  // Check for existing OAuth data on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('google_oauth_data, email')
        .eq('id', session.user.id)
        .single();

      if (profile?.google_oauth_data?.access_token) {
        console.log('Found existing Google OAuth data');
        setAccessToken(profile.google_oauth_data.access_token);
        setUserEmail(profile.email);
        await initializeGoogleServices(profile.google_oauth_data.access_token);
      }
    };

    checkExistingAuth();
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

  const initializeGoogleServices = async (token: string) => {
    try {
      // Test Gmail connection
      const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (gmailResponse.ok) {
        setGmailConnected(true);
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

      if (gaResponse.ok) {
        const gaData = await gaResponse.json();
        setGaConnected(true);

        // Fetch GA4 properties for all accounts
        const allProperties = [];
        for (const account of gaData.accounts || []) {
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

      if (gscResponse.ok) {
        const gscData = await gscResponse.json();
        if (gscData.siteEntry?.length > 0) {
          setGscConnected(true);
          setGscAccounts(
            gscData.siteEntry.map((s: any) => ({
              id: s.siteUrl,
              name: s.siteUrl,
            }))
          );
        }
      }
    } catch (error: any) {
      console.error('Error initializing Google services:', error);
      handleApiError(error, "Google Services");
    }
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
      setUserEmail(userInfo.email);

      // Initialize Google services
      await initializeGoogleServices(googleAccessToken);

      // Save OAuth data to profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase
          .from('profiles')
          .update({
            google_oauth_data: {
              access_token: googleAccessToken,
              email: userInfo.email,
              timestamp: new Date().toISOString()
            }
          })
          .eq('id', session.user.id);
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