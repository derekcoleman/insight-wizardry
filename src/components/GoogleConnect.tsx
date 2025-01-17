import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AnalysisResults } from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleLogin } from "@react-oauth/google";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { ConnectionStatus } from "@/components/ConnectionStatus";

export function GoogleConnect() {
  const [selectedGaAccount, setSelectedGaAccount] = useState<string>("");
  const [selectedGscAccount, setSelectedGscAccount] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
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
    handleLogin,
    fetchConversionGoals,
    accessToken,
  } = useGoogleServices();

  const handleGaAccountChange = async (value: string) => {
    try {
      setSelectedGaAccount(value);
      setAnalysisError(null); // Reset any previous errors
      
      if (value) {
        console.log("Fetching conversion goals for GA4 property:", value);
        await fetchConversionGoals(value);
        
        if (accessToken) {
          await handleAnalyze(value);
        }
      }
    } catch (error) {
      console.error("Error handling GA account change:", error);
      toast({
        title: "Error",
        description: "Failed to fetch conversion goals. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async (gaProperty: string) => {
    if (!gaProperty || !accessToken) {
      console.log("Missing required data:", { gaProperty, hasAccessToken: !!accessToken });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      console.log("Starting analysis with:", {
        ga4Property: gaProperty,
        gscProperty: selectedGscAccount,
        hasAccessToken: !!accessToken,
        mainConversionGoal: selectedGoal,
      });

      const result = await supabase.functions.invoke('analyze-ga4-data', {
        body: {
          ga4Property: gaProperty,
          gscProperty: selectedGscAccount,
          accessToken: accessToken,
          mainConversionGoal: selectedGoal || undefined,
        },
      });

      if (result.error) {
        console.error('Analysis error:', result.error);
        throw result.error;
      }
      
      if (!result.data?.report) {
        throw new Error('No report data received from analysis');
      }

      setReport(result.data.report);
      toast({
        title: "Success",
        description: "Analysis completed successfully",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze data');
      toast({
        title: "Error",
        description: "Failed to analyze data. Please try again.",
        variant: "destructive",
      });
      setReport(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Connect Google Services</CardTitle>
        </CardHeader>
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
          
          <GoogleAuthButton onClick={handleLogin} isLoading={isLoading} />

          <ConnectionStatus gaConnected={gaConnected} gscConnected={gscConnected} />

          {gaAccounts.length > 0 && (
            <PropertySelector
              label="Select Google Analytics 4 Property"
              accounts={gaAccounts}
              value={selectedGaAccount}
              onValueChange={handleGaAccountChange}
              placeholder="Select GA4 property"
            />
          )}

          {conversionGoals.length > 0 && (
            <ConversionGoalSelector
              goals={conversionGoals}
              value={selectedGoal}
              onValueChange={setSelectedGoal}
            />
          )}

          {gaAccounts.length > 0 && gscAccounts.length > 0 && (
            <Separator className="my-4" />
          )}

          {gscAccounts.length > 0 && (
            <PropertySelector
              label="Select Search Console Property"
              accounts={gscAccounts}
              value={selectedGscAccount}
              onValueChange={setSelectedGscAccount}
              placeholder="Select Search Console property"
            />
          )}

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