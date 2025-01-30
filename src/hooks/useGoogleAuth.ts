import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoogleOAuthData {
  access_token: string;
  email: string;
}

export function useGoogleAuth() {
  const [oauthData, setOauthData] = useState<GoogleOAuthData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadStoredOAuthData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('google_oauth_data')
          .eq('id', session.user.id)
          .single();

        if (profile?.google_oauth_data) {
          setOauthData(profile.google_oauth_data as GoogleOAuthData);
        }
      } catch (error) {
        console.error('Error loading OAuth data:', error);
      }
    };

    loadStoredOAuthData();
  }, []);

  const storeOAuthData = async (data: GoogleOAuthData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          google_oauth_data: data as any // Cast to any to satisfy Supabase's Json type
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setOauthData(data);
      toast({
        title: "Success",
        description: "Google account connected successfully",
      });
    } catch (error: any) {
      console.error('Error storing OAuth data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to store Google account data",
        variant: "destructive",
      });
    }
  };

  return {
    oauthData,
    storeOAuthData
  };
}