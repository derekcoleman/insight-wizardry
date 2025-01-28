import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AnalysisResults } from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { ConnectionStatus } from "@/components/ConnectionStatus";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: { report: any }) => void;
}

export function GoogleConnect({ onConnectionChange, onAnalysisComplete }: GoogleConnectProps) {
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
    userEmail
  } = useGoogleServices();

  useEffect(() => {
    onConnectionChange?.(gaConnected || gscConnected);
  }, [gaConnected, gscConnected, onConnectionChange]);

  useEffect(() => {
    const createUserProfile = async () => {
      if (userEmail) {
        try {
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking profile:', fetchError);
            return;
          }

          if (!existingProfile) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{ email: userEmail }]);

            if (insertError) {
              console.error('Error creating profile:', insertError);
            }
          }
        } catch (error) {
          console.error('Error in profile creation:', error);
        }
      }
    };

    createUserProfile();
  }, [userEmail]);

  const handleGaAccountChange = async (value: string) => {
    try {
      setSelectedGaAccount(value);
      setSelectedGoal(""); // Reset goal when changing account
      setAnalysisError(null);
      setReport(null);
      
      if (value) {
        console.log("Fetching conversion goals for GA4 property:", value);
        await fetchConversionGoals(value);
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

  const handleAnalyze = async () => {
    if (!selectedGaAccount || !accessToken) {
      console.log("Missing required data:", { selectedGaAccount, hasAccessToken: !!accessToken });
      toast({
        title: "Error",
        description: "Please select a Google Analytics property first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      console.log("Starting analysis with:", {
        ga4Property: selectedGaAccount,
        gscProperty: selectedGscAccount,
        hasAccessToken: !!accessToken,
        mainConversionGoal: selectedGoal,
      });

      const result = await supabase.functions.invoke('analyze-ga4-data', {
        body: {
          ga4Property: selectedGaAccount,
          gscProperty: selectedGscAccount,
          accessToken: accessToken,
          mainConversionGoal: selectedGoal || undefined,
        },
      });

      if (result.error) {
        console.error('Analysis error:', result.error);
        throw new Error(result.error.message || 'Failed to analyze data');
      }
      
      if (!result.data?.report) {
        throw new Error('No report data received from analysis');
      }

      setReport(result.data.report);
      onAnalysisComplete?.(result.data);
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

          <ConnectionStatus gaConnected={gaConnected} gscConnected={gscConnected} />

          {gaAccounts.length > 0 && (
            <div className="max-w-md mx-auto">
              <PropertySelector
                label="Select Google Analytics 4 Property"
                accounts={gaAccounts}
                value={selectedGaAccount}
                onValueChange={handleGaAccountChange}
                placeholder="Select GA4 property"
              />
            </div>
          )}

          {conversionGoals.length > 0 && (
            <div className="max-w-md mx-auto">
              <ConversionGoalSelector
                goals={conversionGoals}
                value={selectedGoal}
                onValueChange={setSelectedGoal}
              />
            </div>
          )}

          {gaAccounts.length > 0 && gscAccounts.length > 0 && (
            <Separator className="my-4" />
          )}

          {gscAccounts.length > 0 && (
            <div className="max-w-md mx-auto">
              <PropertySelector
                label="Select Search Console Property"
                accounts={gscAccounts}
                value={selectedGscAccount}
                onValueChange={setSelectedGscAccount}
                placeholder="Select Search Console property"
              />
            </div>
          )}

          {selectedGaAccount && (
            <div className="max-w-sm mx-auto">
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Data
              </Button>
            </div>
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
