
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, RefreshCw, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AnalysisResults } from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleServices } from "@/hooks/useGoogleServices";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GoogleConnectProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function GoogleConnect({ onConnectionChange }: GoogleConnectProps) {
  const { user } = useAuth();
  const [selectedGaAccount, setSelectedGaAccount] = useState<string>("");
  const [selectedGscAccount, setSelectedGscAccount] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [auditTitle, setAuditTitle] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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
    refreshAccounts,
  } = useGoogleServices();

  useEffect(() => {
    onConnectionChange?.(gaConnected || gscConnected);
  }, [gaConnected, gscConnected, onConnectionChange]);

  const handleGaAccountChange = async (value: string) => {
    try {
      setSelectedGaAccount(value);
      setSelectedGoal("");
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

  const handleRefresh = () => {
    setSelectedGaAccount("");
    setSelectedGscAccount("");
    setSelectedGoal("");
    refreshAccounts();
  };

  const saveAudit = async () => {
    if (!user || !report) {
      toast({
        title: "Error",
        description: "Please sign in and run an analysis first.",
        variant: "destructive",
      });
      return;
    }

    if (!auditTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for your audit.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('saved_audits').insert({
        user_id: user.id,
        title: auditTitle.trim(),
        description: `SEO audit for ${websiteUrl || 'website'}`,
        audit_data: report,
        audit_type: 'comprehensive',
        ga4_property: selectedGaAccount,
        gsc_property: selectedGscAccount,
        website_url: websiteUrl,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Audit saved successfully!",
      });
      
      setAuditTitle("");
    } catch (error) {
      console.error('Error saving audit:', error);
      toast({
        title: "Error",
        description: "Failed to save audit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
      setAuditTitle(`SEO Audit - ${new Date().toLocaleDateString()}`);
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
      <Card>
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

          {gaConnected && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Properties
              </Button>
            </div>
          )}

          {gaAccounts.length > 0 && (
            <div className="space-y-4">
              <div className="max-w-md mx-auto">
                <PropertySelector
                  label="Select Google Analytics 4 Property"
                  accounts={gaAccounts}
                  value={selectedGaAccount}
                  onValueChange={handleGaAccountChange}
                  placeholder="Select GA4 property"
                />
              </div>

              <div className="max-w-md mx-auto">
                <Label htmlFor="website-url">Website URL (Optional)</Label>
                <Input
                  id="website-url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
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
                Run SEO Audit
              </Button>
            </div>
          )}

          {report && user && (
            <div className="max-w-md mx-auto space-y-3 pt-4 border-t">
              <Label htmlFor="audit-title">Save This Audit</Label>
              <Input
                id="audit-title"
                placeholder="Enter audit title..."
                value={auditTitle}
                onChange={(e) => setAuditTitle(e.target.value)}
              />
              <Button 
                onClick={saveAudit}
                disabled={isSaving || !auditTitle.trim()}
                className="w-full"
                variant="outline"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Audit
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
