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
import { GoogleAuthCheck } from "@/components/google/GoogleAuthCheck";
import { useToast } from "@/hooks/use-toast";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: { report: any }) => void;
}

export function GoogleConnect({ onConnectionChange, onAnalysisComplete }: GoogleConnectProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const { toast } = useToast();

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
      onAnalysisComplete?.(result.data);
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
          
          <div className="max-w-sm mx-auto">
            <GoogleAuthButton onClick={handleLogin} isLoading={isLoading} />
          </div>

          <ConnectionStatus 
            gaConnected={gaConnected} 
            gscConnected={gscConnected} 
            gmailConnected={gmailConnected}
          />

          <GooglePropertyForm
            gaAccounts={gaAccounts}
            gscAccounts={gscAccounts}
            conversionGoals={conversionGoals}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            fetchConversionGoals={fetchConversionGoals}
          />

          {analysisError && (
            <Alert variant="destructive" className="mt-4">
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
