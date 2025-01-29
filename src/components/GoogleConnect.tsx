import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { GooglePropertyForm } from "@/components/google/GooglePropertyForm";
import { useToast } from "@/hooks/use-toast";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: { report: any }) => void;
}

interface GoogleOAuthData {
  connected: boolean;
  email: string;
}

const isGoogleOAuthData = (data: any): data is GoogleOAuthData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.connected === 'boolean' &&
    typeof data.email === 'string'
  );
};

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
    userEmail,
    gaAccounts,
    gscAccounts,
    conversionGoals,
    fetchConversionGoals,
    isAnalyzing,
    handleAnalyze
  } = useGoogleServices();

  // Check if user is already authenticated with Google
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user?.id) {
          console.log("No active session found");
          return;
        }

        console.log("Active session found:", session.user.id);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('google_oauth_data')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        const googleOAuthData = profile?.google_oauth_data;
        if (isGoogleOAuthData(googleOAuthData) && googleOAuthData.connected) {
          console.log("Found existing Google OAuth data:", googleOAuthData);
          onConnectionChange?.(true);
          navigate('/projects');
        }
      } catch (error: any) {
        console.error("Session check error:", error);
        setError(error.message);
        toast({
          title: "Session Error",
          description: "Failed to check session status. Please try again.",
          variant: "destructive",
        });
      }
    };

    checkSession();
  }, [onConnectionChange, navigate, toast]);

  // Handle Google services connection status changes
  useEffect(() => {
    const updateUserProfile = async () => {
      if (!userEmail) {
        console.log("No user email available");
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user?.id) {
          console.error("No active session found when updating profile");
          return;
        }

        console.log("Updating profile for user:", session.user.id);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: userEmail,
            google_oauth_data: {
              connected: true,
              email: userEmail
            }
          })
          .eq('id', session.user.id);

        if (updateError) throw updateError;

        console.log("Profile updated successfully");
        onConnectionChange?.(true);
        navigate('/projects');
      } catch (error: any) {
        console.error("Profile update error:", error);
        setError(error.message);
        toast({
          title: "Update Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (userEmail) {
      updateUserProfile();
    }
  }, [userEmail, navigate, onConnectionChange, toast]);

  const handlePropertyAnalysis = async (gaProperty: string, gscProperty: string, goal: string) => {
    try {
      const result = await handleAnalyze(gaProperty, gscProperty, goal);
      onAnalysisComplete?.(result);
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

        {(gaConnected || gscConnected) && (
          <GooglePropertyForm
            gaAccounts={gaAccounts}
            gscAccounts={gscAccounts}
            conversionGoals={conversionGoals}
            isAnalyzing={isAnalyzing}
            onAnalyze={handlePropertyAnalysis}
            fetchConversionGoals={fetchConversionGoals}
          />
        )}
      </CardContent>
    </Card>
  );
}