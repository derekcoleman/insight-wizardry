import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useToast } from "@/hooks/use-toast";

interface AnalysisData {
  report: {
    weekly_analysis: any;
    monthly_analysis: any;
    quarterly_analysis: any;
    ytd_analysis: any;
    last28_yoy_analysis: any;
  };
  ga4Property?: string;
  gscProperty?: string;
  mainConversionGoal?: string;
}

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: AnalysisData) => void;
}

export function GoogleConnect({ onConnectionChange, onAnalysisComplete }: GoogleConnectProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    isLoading,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin,
    accessToken,
    userEmail
  } = useGoogleServices();

  useEffect(() => {
    if (gaConnected || gscConnected || gmailConnected) {
      console.log("Connection status changed:", { gaConnected, gscConnected, gmailConnected });
      onConnectionChange?.(true);
    }
  }, [gaConnected, gscConnected, gmailConnected, onConnectionChange]);

  useEffect(() => {
    if (userEmail && accessToken) {
      const updateProfile = async () => {
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              google_oauth_data: {
                email: userEmail,
                access_token: accessToken,
                connected: true
              }
            })
            .eq('email', userEmail);

          if (updateError) throw updateError;
        } catch (err: any) {
          console.error('Error updating profile:', err);
          setError(err.message);
        }
      };

      updateProfile();
    }
  }, [userEmail, accessToken]);

  return (
    <div className="space-y-6">
      <Card className="max-w-xl mx-auto">
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="whitespace-pre-line">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {!gaConnected && !gscConnected && !gmailConnected && (
            <div className="max-w-sm mx-auto">
              <GoogleAuthButton onClick={handleLogin} isLoading={isLoading} />
            </div>
          )}

          <ConnectionStatus 
            gaConnected={gaConnected} 
            gscConnected={gscConnected} 
            gmailConnected={gmailConnected}
          />
        </CardContent>
      </Card>
    </div>
  );
}