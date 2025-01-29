import { useState, useEffect } from "react";
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

const GOOGLE_TOKEN_KEY = 'google_access_token';
const GOOGLE_TOKEN_EXPIRY_KEY = 'google_token_expiry';

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

  // Load stored token on mount and verify it
  useEffect(() => {
    const verifyStoredToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No Supabase session found");
          return;
        }

        const storedToken = localStorage.getItem(GOOGLE_TOKEN_KEY);
        const tokenExpiry = localStorage.getItem(GOOGLE_TOKEN_EXPIRY_KEY);
        
        if (storedToken && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry);
          if (expiryTime > Date.now()) {
            console.log("Found valid stored Google token");
            setAccessToken(storedToken);
            await initializeWithToken(storedToken);
          } else {
            console.log("Stored token expired, clearing");
            localStorage.removeItem(GOOGLE_TOKEN_KEY);
            localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
          }
        }
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    };

    verifyStoredToken();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      if (event === 'SIGNED_IN') {
        const storedToken = localStorage.getItem(GOOGLE_TOKEN_KEY);
        if (storedToken) {
          await initializeWithToken(storedToken);
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
        localStorage.removeItem(GOOGLE_TOKEN_EXPIRY_KEY);
        setAccessToken(null);
        setUserEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const storeToken = (token: string) => {
    // Store token with 1 hour expiry
    const expiryTime = Date.now() + (60 * 60 * 1000);
    localStorage.setItem(GOOGLE_TOKEN_KEY, token);
    localStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiryTime.toString());
    setAccessToken(token);
  };

  const initializeWithToken = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();
      console.log("Received user info:", { email: userInfo.email });
      setUserEmail(userInfo.email);

      // Update profile in Supabase with Google OAuth data
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            google_oauth_data: {
              email: userInfo.email,
              access_token: token,
              connected: true
            }
          })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw new Error('Failed to update profile with Google data');
        }
      } else {
        console.error('No Supabase session found when trying to update profile');
        throw new Error('Authentication required');
      }

      // Test service connections
      const [gaResponse, gscResponse, gmailResponse] = await Promise.all([
        fetch('https://analyticsadmin.googleapis.com/v1alpha/accounts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://www.googleapis.com/webmasters/v3/sites', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      setGaConnected(gaResponse.ok);
      setGscConnected(gscResponse.ok);
      setGmailConnected(gmailResponse.ok);

      if (gaResponse.ok) {
        const gaData = await gaResponse.json();
        if (gaData.accounts?.length > 0) {
          const allProperties = [];
          for (const account of gaData.accounts) {
            const propertiesResponse = await fetch(
              `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
              {
                headers: { Authorization: `Bearer ${token}` },
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
      }

      if (gscResponse.ok) {
        const gscData = await gscResponse.json();
        if (gscData.siteEntry?.length > 0) {
          setGscAccounts(
            gscData.siteEntry.map((s: any) => ({
              id: s.siteUrl,
              name: s.siteUrl,
            }))
          );
        }
      }

    } catch (error: any) {
      console.error('Error in initializeWithToken:', error);
      setError(error.message || 'Failed to initialize Google services');
      toast({
        title: "Error",
        description: error.message || 'Failed to initialize Google services',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      console.log("Google login successful, token:", response.access_token);
      storeToken(response.access_token);
      await initializeWithToken(response.access_token);
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
      setError(error.message || "Failed to fetch events");
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
    handleLogin: () => login(),
    fetchConversionGoals,
    accessToken,
    userEmail,
  };
}