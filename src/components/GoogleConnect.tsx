import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function GoogleConnect({ onConnectionChange }: GoogleConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const {
    gaConnected,
    gscConnected,
    handleLogin,
  } = useGoogleServices();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No active session");
          return;
        }

        const { error } = await supabase.functions.invoke('check-auth-status');
        if (error) {
          console.error("Auth status check failed:", error);
          setError("Failed to verify authentication status");
          toast({
            title: "Error",
            description: "Failed to verify authentication status",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setError("Failed to check authentication status");
      }
    };

    checkAuthStatus();
  }, [toast]);

  useEffect(() => {
    onConnectionChange?.(gaConnected || gscConnected);
  }, [gaConnected, gscConnected, onConnectionChange]);

  return (
    <div className="space-y-6">
      <Card className="max-w-xl mx-auto">
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="max-w-sm mx-auto">
            <GoogleAuthButton 
              onClick={handleLogin} 
              isLoading={isLoading} 
              mode={gaConnected ? 'connect' : 'login'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}