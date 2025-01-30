import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { ConnectionStatus } from "@/components/ConnectionStatus";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: any) => void | Promise<void>;
}

export function GoogleConnect({ onConnectionChange, onAnalysisComplete }: GoogleConnectProps) {
  const {
    isLoading,
    error,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin,
  } = useGoogleServices();

  return (
    <div className="space-y-6">
      <CardContent className="space-y-4">
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
    </div>
  );
}