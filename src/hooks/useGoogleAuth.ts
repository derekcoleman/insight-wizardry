import { useState } from "react";
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

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("google_oauth_data")
        .eq("id", session.user.id)
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

  // Effect to handle profile data changes
  if (profile?.google_oauth_data && !oauthData) {
    const data = profile.google_oauth_data;
    if (isGoogleOAuthData(data)) {
      setOauthData(data);
    }
  }

  const updateOAuthData = async (data: GoogleOAuthData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
        description: "Google authentication data updated",
      });
    } catch (error: any) {
      console.error("Error updating OAuth data:", error);
      toast({
        title: "Error",
        description: "Failed to update Google authentication data",
        variant: "destructive",
      });
    }
  };

  return {
    oauthData,
    updateOAuthData,
  };
}