import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleAuthButtonProps {
  onClick: () => void;
  isLoading: boolean;
  mode?: 'connect' | 'login';
}

export function GoogleAuthButton({ onClick, isLoading, mode = 'connect' }: GoogleAuthButtonProps) {
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: [
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/webmasters.readonly",
            "https://www.googleapis.com/auth/analytics",
            "https://www.googleapis.com/auth/analytics.edit",
            "https://www.googleapis.com/auth/userinfo.email"
          ].join(" ")
        }
      });

      if (error) {
        console.error("Google sign in error:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data) {
        onClick();
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      {mode === 'connect' ? 'Connect Google Account' : 'Sign in with Google'}
    </Button>
  );
}