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
  } = useGoogleServices();

  const handleGaAccountChange = async (value: string) => {
    setSelectedGaAccount(value);
    if (value) {
      await fetchConversionGoals(value);
    }
  };

  const analyzeLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await supabase.functions.invoke('analyze-ga4-data', {
          body: {
            ga4Property: selectedGaAccount,
            gscProperty: selectedGscAccount,
            accessToken: tokenResponse.access_token,
            mainConversionGoal: selectedGoal || undefined,
          },
        });

        if (result.error) throw result.error;
        
        setReport(result.data.report);
        toast({
          title: "Success",
          description: "Analysis completed successfully",
        });
      } catch (error) {
        console.error('Analysis error:', error);
        toast({
          title: "Error",
          description: "Failed to analyze data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    },
    flow: "implicit",
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics",
      "https://www.googleapis.com/auth/analytics.edit"
    ].join(" ")
  });

  const handleAnalyze = async () => {
    if (!selectedGaAccount) {
      toast({
        title: "Error",
        description: "Please select a GA4 property",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      analyzeLogin();
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze data. Please try again.",
        variant: "destructive",
      });
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

          {(selectedGaAccount || selectedGscAccount) && (
            <CardContent className="pt-4">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedGaAccount}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing Data...
                  </>
                ) : (
                  "Continue with Analysis"
                )}
              </Button>
            </CardContent>
          )}
        </CardContent>
      </Card>

      {(isAnalyzing || report) && (
        <AnalysisResults report={report} isLoading={isAnalyzing} />
      )}
    </div>
  );
}