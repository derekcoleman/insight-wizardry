import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Account {
  id: string;
  name: string;
}

const GOOGLE_TOKEN_KEY = 'google_access_token';
const GOOGLE_TOKEN_EXPIRY_KEY = 'google_token_expiry';

export function useGoogleServices() {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const verifyStoredToken = async () => {
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
    };

    verifyStoredToken();
  }, []);

  const storeToken = (token: string) => {
    const expiryTime = Date.now() + (60 * 60 * 1000);
    localStorage.setItem(GOOGLE_TOKEN_KEY, token);
    localStorage.setItem(GOOGLE_TOKEN_EXPIRY_KEY, expiryTime.toString());
    setAccessToken(token);
  };

  const initializeWithToken = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();
      setUserEmail(userInfo.email);

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

      // Sign in to Supabase with Google token
      const { error: signInError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token,
        nonce: 'NONCE', // Replace with a secure nonce in production
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
  });

  return {
    gaAccounts,
    gscAccounts,
    isLoading,
    error,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin: () => login(),
    accessToken,
    userEmail,
  };
}