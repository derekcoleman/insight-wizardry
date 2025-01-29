import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useGoogleServices() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeWithToken = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

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

      // Sign in to Supabase with Google OAuth
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_token: token,
            prompt: 'consent'
          }
        }
      });

      if (signInError) {
        throw signInError;
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
      console.log("Google login successful");
      setAccessToken(response.access_token);
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
  });

  return {
    isLoading,
    error,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin: () => login(),
    accessToken,
  };
}