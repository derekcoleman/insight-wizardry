import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { Button } from "@/components/ui/button";

interface AnalysisData {
  report: {
    weekly_analysis: any;
    monthly_analysis: any;
    quarterly_analysis: any;
    ytd_analysis: any;
    last28_yoy_analysis: any;
  } | null;
}

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
  onAnalysisComplete?: (data: AnalysisData) => void;
}

export function GoogleConnect({ onConnectionChange, onAnalysisComplete }: GoogleConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGA4Property, setSelectedGA4Property] = useState("");
  const [selectedGSCProperty, setSelectedGSCProperty] = useState("");
  const [selectedConversionGoal, setSelectedConversionGoal] = useState("Total Events");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  
  const {
    gaAccounts,
    gscAccounts,
    conversionGoals,
    gaConnected,
    gscConnected,
    handleLogin,
    fetchConversionGoals,
    accessToken,
  } = useGoogleServices();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log("No active session");
          return;
        }

        const { data, error } = await supabase.functions.invoke('check-auth-status');
        if (error) {
          console.error("Auth status check failed:", error);
          setError("Failed to verify authentication status");
          toast({
            title: "Error",
            description: "Failed to verify authentication status",
            variant: "destructive",
          });
        } else if (data) {
          onAnalysisComplete?.(data as AnalysisData);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setError("Failed to check authentication status");
      }
    };

    checkAuthStatus();
  }, [toast, onAnalysisComplete]);

  useEffect(() => {
    onConnectionChange?.(gaConnected || gscConnected);
  }, [gaConnected, gscConnected, onConnectionChange]);

  useEffect(() => {
    if (selectedGA4Property) {
      fetchConversionGoals(selectedGA4Property);
    }
  }, [selectedGA4Property, fetchConversionGoals]);

  const handleAnalyze = async () => {
    if (!selectedGA4Property || !accessToken) {
      toast({
        title: "Missing Requirements",
        description: "Please select a GA4 property to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-ga4-data', {
        body: {
          ga4Property: selectedGA4Property,
          gscProperty: selectedGSCProperty,
          accessToken,
          mainConversionGoal: selectedConversionGoal
        }
      });

      if (error) {
        console.error("Analysis failed:", error);
        toast({
          title: "Error",
          description: "Failed to analyze data",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        onAnalysisComplete?.(data as AnalysisData);
        toast({
          title: "Success",
          description: "Analysis completed successfully",
        });
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      toast({
        title: "Error",
        description: "An error occurred during analysis",
        variant: "destructive",
      });
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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="max-w-sm mx-auto">
              <GoogleAuthButton 
                onClick={handleLogin} 
                isLoading={isLoading} 
                mode={gaConnected ? 'connect' : 'login'}
              />
            </div>

            {(gaConnected || gscConnected) && (
              <ConnectionStatus gaConnected={gaConnected} gscConnected={gscConnected} />
            )}

            {gaConnected && (
              <>
                <PropertySelector
                  label="Select GA4 Property"
                  accounts={gaAccounts}
                  value={selectedGA4Property}
                  onValueChange={setSelectedGA4Property}
                  placeholder="Select GA4 property"
                />

                {selectedGA4Property && (
                  <ConversionGoalSelector
                    goals={conversionGoals}
                    value={selectedConversionGoal}
                    onValueChange={setSelectedConversionGoal}
                  />
                )}
              </>
            )}

            {gscConnected && (
              <PropertySelector
                label="Select Search Console Property"
                accounts={gscAccounts}
                value={selectedGSCProperty}
                onValueChange={setSelectedGSCProperty}
                placeholder="Select Search Console property"
              />
            )}

            {(gaConnected || gscConnected) && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleAnalyze}
                  disabled={!selectedGA4Property || isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}