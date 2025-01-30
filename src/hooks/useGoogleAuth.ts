import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GoogleOAuthData {
  access_token: string;
  email: string;
}

export function useGoogleAuth() {
  const [oauthData, setOauthData] = useState<GoogleOAuthData | null>(null);
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

  // Type guard to check if the data matches GoogleOAuthData structure
  const isGoogleOAuthData = (data: any): data is GoogleOAuthData => {
    return data && 
           typeof data.access_token === 'string' && 
           typeof data.email === 'string';
  };

  useEffect(() => {
    if (profile?.google_oauth_data && !oauthData) {
      const data = profile.google_oauth_data;
      if (isGoogleOAuthData(data)) {
        setOauthData(data);
      }
    }
  }, [profile, oauthData]);

  const updateOAuthData = async (data: GoogleOAuthData) => {
    try {
      if (!session?.user?.id) {
        throw new Error("No authenticated user");
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          google_oauth_data: {
            access_token: data.access_token,
            email: data.email
          }
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setOauthData(data);
      
      toast({
        title: "Success",
        description: "Google OAuth data updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating OAuth data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update OAuth data",
        variant: "destructive",
      });
    }
  };

  return {
    oauthData,
    updateOAuthData,
  };
}