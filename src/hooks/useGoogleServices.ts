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

  const signInWithGoogle = async (googleAccessToken: string) => {
    try {
      console.log("Starting Google OAuth flow...");
      
      // Get user info from Google first
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

      // Sign in with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          queryParams: {
            access_token: googleAccessToken,
            scope: [
              "https://www.googleapis.com/auth/analytics.readonly",
              "https://www.googleapis.com/auth/webmasters.readonly",
              "https://www.googleapis.com/auth/gmail.readonly",
              "https://www.googleapis.com/auth/userinfo.email",
              "https://www.googleapis.com/auth/userinfo.profile"
            ].join(" ")
          },
        },
      });

      if (signInError) {
        console.error('Error signing in with Google:', signInError);
        throw signInError;
      }

      console.log("Supabase sign in successful:", signInData);

      // Get the session immediately after sign in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user?.id) {
        // Try to get the session one more time after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: { session: retrySession }, error: retryError } = await supabase.auth.getSession();
        
        if (retryError || !retrySession?.user?.id) {
          console.error('No session available after retry');
          throw new Error('Failed to establish session - please try again');
        }
        
        // Update the profile with retry session
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: retrySession.user.id,
            email: userInfo.email,
            google_oauth_data: userInfo
          }, {
            onConflict: 'id'
          });

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
      } else {
        // Update the profile with initial session
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            email: userInfo.email,
            google_oauth_data: userInfo
          }, {
            onConflict: 'id'
          });

        if (updateError) {
          console.error('Error updating profile:', updateError);
          throw updateError;
        }
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

      setAccessToken(googleAccessToken);
      toast({
        title: "Connected",
        description: "Successfully connected with Google services",
      });

    } catch (error: any) {
      console.error('Error in signInWithGoogle:', error);
      handleApiError(error, "Google Services");
      throw error;
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
        await signInWithGoogle(response.access_token);

        // Fetch GA4 accounts
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

        // Fetch GA4 properties
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

        // Fetch Search Console sites
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
        handleApiError(error, "Google Services");
      } finally {
        setIsLoading(false);
      }
    },
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
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
    gmailConnected,
    handleLogin: () => login(),
    fetchConversionGoals,
    accessToken,
    userEmail,
  };
}