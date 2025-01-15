import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AnalysisResults } from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";

interface Account {
  id: string;
  name: string;
}

export function GoogleConnect() {
  const [gaAccounts, setGaAccounts] = useState<Account[]>([]);
  const [gscAccounts, setGscAccounts] = useState<Account[]>([]);
  const [selectedGaAccount, setSelectedGaAccount] = useState<string>("");
  const [selectedGscAccount, setSelectedGscAccount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaConnected, setGaConnected] = useState(false);
  const [gscConnected, setGscConnected] = useState(false);
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const handleApiError = (error: any, apiName: string) => {
    console.error(`${apiName} API Error:`, error);
    let errorMessage = "An unknown error occurred";
    let detailedError = "";

    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);

      if (error.response.status === 403) {
        if (error.response.data?.error?.reason === "accessNotConfigured") {
          errorMessage = `${apiName} API is not enabled.`;
          detailedError = `Please follow these steps:
          1. Go to Google Cloud Console
          2. Enable the ${apiName} API at: ${error.response.data?.error?.details?.[0]?.metadata?.activationUrl || 'https://console.cloud.google.com'}
          3. Wait a few minutes for changes to propagate
          4. Try connecting again`;
        } else {
          errorMessage = `Access denied to ${apiName}. Please check:`;
          detailedError = `
            1. The ${apiName} API is enabled in your Google Cloud Console
            2. Your account has the necessary permissions
            3. You've granted all required OAuth scopes during login
          `;
          if (apiName === "Search Console") {
            detailedError += "\n4. You have verified ownership of the sites in Search Console";
          }
        }
      } else if (error.response.status === 401) {
        errorMessage = `Authentication failed for ${apiName}.`;
        detailedError = "Please try logging in again or check if your Google Cloud project is properly configured.";
      } else if (error.response.status === 404) {
        errorMessage = `${apiName} resource not found.`;
        if (apiName === "Search Console") {
          detailedError = "Please verify that you have sites added and verified in your Search Console account.";
        } else {
          detailedError = "Please verify that you have GA4 properties set up in your Google Analytics account.";
        }
      } else if (error.response.status === 429) {
        errorMessage = `Too many requests to ${apiName}.`;
        detailedError = "Please wait a few minutes and try again.";
      } else {
        errorMessage = `${apiName} API error: ${error.response.status} - ${error.response.statusText}`;
        detailedError = error.response.data?.error?.message || "No additional error details available.";
      }
    } else if (error.request) {
      console.error('Error Request:', error.request);
      errorMessage = `No response received from ${apiName} API.`;
      detailedError = "Please check your internet connection and try again.";
    } else {
      console.error('Error Message:', error.message);
      errorMessage = `Error accessing ${apiName}`;
      detailedError = error.message || "An unexpected error occurred.";
    }

    setError(`${errorMessage}\n${detailedError}`);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      setError(null);
      
      try {
      // Fetch GA4 accounts
      try {
        console.log("Fetching GA4 accounts...");
        const gaResponse = await fetch(
          "https://analyticsadmin.googleapis.com/v1alpha/accounts",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );

        if (!gaResponse.ok) {
          const errorData = await gaResponse.json().catch(() => ({}));
          console.error("GA4 Error Response:", errorData);
          throw new Error(`GA4 API error: ${gaResponse.statusText}\n${JSON.stringify(errorData, null, 2)}`);
        }

        const gaData = await gaResponse.json();
        console.log("GA4 Response:", gaData);

        if (!gaData.accounts || gaData.accounts.length === 0) {
          throw new Error("No GA4 accounts found. Please make sure you have access to GA4 accounts.");
        }

        // Fetch properties for all accounts
        console.log("Fetching GA4 properties for all accounts...");
        const allProperties = [];
        
        for (const account of gaData.accounts) {
          const propertiesResponse = await fetch(
            `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
            {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            }
          );

          if (!propertiesResponse.ok) {
            console.warn(`Failed to fetch properties for account ${account.name}:`, await propertiesResponse.json());
            continue; // Skip this account but continue with others
          }

          const propertiesData = await propertiesResponse.json();
          if (propertiesData.properties) {
            allProperties.push(...propertiesData.properties);
          }
        }

        console.log("All GA4 Properties Response:", allProperties);
        
        if (allProperties.length === 0) {
          console.log("No GA4 properties found");
          toast({
            title: "Warning",
            description: "No Google Analytics 4 properties found for your accounts. Please make sure you have access to GA4 properties.",
            variant: "destructive",
          });
        } else {
          setGaConnected(true);
          toast({
            title: "Success",
            description: "Successfully connected to Google Analytics 4",
          });
        }
        
        setGaAccounts(
          allProperties.map((p: any) => ({
            id: p.name,
            name: p.displayName,
          }))
        );
      } catch (error: any) {
        handleApiError(error, "Google Analytics");
      }

      // Fetch Search Console sites
      try {
        console.log("Fetching Search Console sites...");
        const gscResponse = await fetch(
          "https://www.googleapis.com/webmasters/v3/sites",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );

        if (!gscResponse.ok) {
          const errorData = await gscResponse.json().catch(() => ({}));
          console.error("Search Console Error Response:", errorData);
          throw new Error(`Search Console API error: ${gscResponse.statusText}\n${JSON.stringify(errorData, null, 2)}`);
        }

        const gscData = await gscResponse.json();
        console.log("Search Console Response:", gscData);
        
        if (!gscData.siteEntry || gscData.siteEntry.length === 0) {
          console.log("No Search Console sites found");
          toast({
            title: "Warning",
            description: "No Search Console sites found for your account. Please verify that you have:"+
                        "\n1. Added and verified your sites in Search Console"+
                        "\n2. Proper access permissions to the sites",
            variant: "destructive",
          });
        } else {
          setGscConnected(true);
          toast({
            title: "Success",
            description: "Successfully connected to Search Console",
          });
        }
        
        setGscAccounts(
          gscData.siteEntry?.map((s: any) => ({
            id: s.siteUrl,
            name: s.siteUrl,
          })) || []
        );
      } catch (error: any) {
        handleApiError(error, "Search Console");
      } finally {
        setIsLoading(false);
      }
      } catch (error: any) {
        handleApiError(error, "Google Analytics");
      } finally {
        setIsLoading(false);
      }
    },
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics",
      "https://www.googleapis.com/auth/analytics.edit"
    ].join(" "),
    flow: "implicit" // Add this to ensure we get the access token directly
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
      // Instead of calling login directly, we'll create a new promise to handle the token
      const tokenPromise = new Promise<string>((resolve) => {
        login({
          onSuccess: (response) => {
            resolve(response.access_token);
          },
        });
      });

      const accessToken = await tokenPromise;
      
      const result = await supabase.functions.invoke('analyze-ga4-data', {
        body: {
          ga4Property: selectedGaAccount,
          gscProperty: selectedGscAccount,
          accessToken,
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
          
          <Button
            onClick={() => login()}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Connect Google Account
          </Button>

          {(gaConnected || gscConnected) && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Connected Services</AlertTitle>
              <AlertDescription>
                {gaConnected && "✓ Google Analytics 4"}
                {gaConnected && gscConnected && <br />}
                {gscConnected && "✓ Search Console"}
              </AlertDescription>
            </Alert>
          )}

          {gaAccounts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Google Analytics 4 Property
              </label>
              <Select
                value={selectedGaAccount}
                onValueChange={setSelectedGaAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select GA4 property" />
                </SelectTrigger>
                <SelectContent>
                  {gaAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {gaAccounts.length > 0 && gscAccounts.length > 0 && (
            <Separator className="my-4" />
          )}

          {gscAccounts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Select Search Console Property
              </label>
              <Select
                value={selectedGscAccount}
                onValueChange={setSelectedGscAccount}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Search Console property" />
                </SelectTrigger>
                <SelectContent>
                  {gscAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
