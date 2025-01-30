import { Json } from "@/integrations/supabase/types";

export interface GoogleOAuthData {
  access_token: string;
  email: string;
}

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  google_oauth_data: Json | null;
  search_history: Json[] | null;
}