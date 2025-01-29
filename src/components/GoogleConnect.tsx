import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useToast } from "@/hooks/use-toast";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: { report: any }) => void;
}

export function GoogleConnect({ onConnectionChange, onAnalysisComplete }: GoogleConnectProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    isLoading,
    error: servicesError,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin,
    userEmail
  } = useGoogleServices();

  useEffect(() => {
    if (gaConnected || gscConnected || gmailConnected) {
      console.log("Connection status changed:", { gaConnected, gscConnected, gmailConnected });
      onConnectionChange?.(true);
      
      // If user is authenticated and connected, redirect to projects
      if (userEmail) {
        navigate('/projects');
      }
    }
  }, [gaConnected, gscConnected, gmailConnected, userEmail, navigate, onConnectionChange]);

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="space-y-4 pt-6">
        {(error || servicesError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="whitespace-pre-line">
              {error || servicesError}
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
  );
}