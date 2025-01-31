import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { AnalysisResults } from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { GooglePropertyForm } from "@/components/google/GooglePropertyForm";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    gaAccounts,
    gscAccounts,
    conversionGoals,
    isLoading,
    error,
    gaConnected,
    gscConnected,
    gmailConnected,
    handleLogin,
    fetchConversionGoals,
    accessToken,
    userEmail
  } = useGoogleServices();

  useEffect(() => {
    const checkAndStoreSession = async () => {
      if (accessToken && userEmail) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          try {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                google_oauth_data: {
                  access_token: accessToken,
                  email: userEmail
                }
              })
              .eq('id', session.user.id);

            if (updateError) throw updateError;

            toast({
              title: "Success",
              description: "Successfully signed in with Google",
            });

            // Navigate to projects page after successful authentication
            navigate('/projects');
          } catch (error) {
            console.error('Error storing Google OAuth data:', error);
            toast({
              title: "Error",
              description: "Failed to store Google OAuth data",
              variant: "destructive",
            });
          }
        }
      }
    };

    checkAndStoreSession();
  }, [accessToken, userEmail, navigate, toast]);

  useEffect(() => {
    if (gaConnected || gscConnected || gmailConnected) {
      console.log("Connection status changed:", { gaConnected, gscConnected, gmailConnected });
      onConnectionChange?.(true);
    }
  }, [gaConnected, gscConnected, gmailConnected, onConnectionChange]);

  const handleAnalyze = async (ga4Property: string, gscProperty: string, mainConversionGoal: string) => {
    if (!ga4Property || !accessToken) {
      console.error("Missing required data:", { ga4Property, hasAccessToken: !!accessToken });
      setAnalysisError("Missing required Google Analytics property or access token");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      console.log("Starting analysis with:", {
        ga4Property,
        gscProperty,
        hasAccessToken: !!accessToken,
        mainConversionGoal,
      });

      const result = await supabase.functions.invoke('analyze-ga4-data', {
        body: {
          ga4Property,
          gscProperty,
          accessToken,
          mainConversionGoal: mainConversionGoal || undefined,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to analyze data');
      }
      
      if (!result.data?.report) {
        throw new Error('No report data received from analysis');
      }

      setReport(result.data.report);
      onAnalysisComplete?.({
        report: result.data.report,
        ga4Property,
        gscProperty,
        mainConversionGoal
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAnalysisError(error.message || 'Failed to analyze data');
      setReport(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

          {(gaConnected || gscConnected) && (
            <GooglePropertyForm
              gaAccounts={gaAccounts}
              gscAccounts={gscAccounts}
              conversionGoals={conversionGoals}
              isAnalyzing={isAnalyzing}
              onAnalyze={handleAnalyze}
              fetchConversionGoals={fetchConversionGoals}
            />
          )}

          {analysisError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Analysis Error</AlertTitle>
              <AlertDescription>{analysisError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {(isAnalyzing || report) && (
        <AnalysisResults report={report} isLoading={isAnalyzing} />
      )}
    </div>
  );
}