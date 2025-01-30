import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoogleOAuthData {
  access_token: string;
  email: string;
}

export function useGoogleAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session?.user?.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.google_oauth_data) {
      const oauthData = profile.google_oauth_data as GoogleOAuthData;
      setAccessToken(oauthData.access_token);
      setUserEmail(oauthData.email);
    }
  }, [profile]);

  const storeGoogleAuth = async (token: string, email: string) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          google_oauth_data: {
            access_token: token,
            email: email,
          },
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setAccessToken(token);
      setUserEmail(email);
    } catch (error: any) {
      console.error("Error storing Google auth:", error);
      toast({
        title: "Error",
        description: "Failed to store Google authentication data",
        variant: "destructive",
      });
    }
  };

  return {
    accessToken,
    userEmail,
    storeGoogleAuth,
  };
}