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
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const { toast } = useToast();

  const handleApiError = (error: any, apiName: string) => {
    console.error(`${apiName} API Error:`, error);
    let errorMessage = "An unknown error occurred";
    let detailedError = "";

    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);

      if (error.response.status === 403) {
        errorMessage = `Access denied to ${apiName}. Please check:`;
        detailedError = `
          1. The Google Analytics API is enabled in your Google Cloud Console
          2. Your account has the necessary permissions (Editor or Admin role)
          3. You've granted all required OAuth scopes during login
        `;
      } else if (error.response.status === 401) {
        errorMessage = `Authentication failed for ${apiName}.`;
        detailedError = "Please try logging in again or check if your Google Cloud project is properly configured.";
      } else if (error.response.status === 404) {
        errorMessage = `${apiName} resource not found.`;
        detailedError = "Please verify that you have GA4 properties set up in your Google Analytics account.";
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

        // After getting accounts, fetch properties
        console.log("Fetching GA4 properties...");
        const propertiesResponse = await fetch(
          "https://analyticsadmin.googleapis.com/v1beta/properties",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );

        if (!propertiesResponse.ok) {
          const errorData = await propertiesResponse.json().catch(() => ({}));
          console.error("GA4 Properties Error Response:", errorData);
          throw new Error(`GA4 Properties API error: ${propertiesResponse.statusText}\n${JSON.stringify(errorData, null, 2)}`);
        }

        const propertiesData = await propertiesResponse.json();
        console.log("GA4 Properties Response:", propertiesData);
        
        if (!propertiesData.properties || propertiesData.properties.length === 0) {
          console.log("No GA4 properties found");
          toast({
            title: "Warning",
            description: "No Google Analytics 4 properties found for your account. Please make sure you have access to GA4 properties.",
            variant: "destructive",
          });
        }
        
        setGaAccounts(
          propertiesData.properties?.map((p: any) => ({
            id: p.name,
            name: p.displayName,
          })) || []
        );

        // Fetch Search Console sites
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
          throw new Error(`Search Console API error: ${gscResponse.statusText}`);
        }

        const gscData = await gscResponse.json();
        console.log("GSC Response:", gscData);
        
        if (!gscData.siteEntry || gscData.siteEntry.length === 0) {
          console.log("No Search Console sites found");
          toast({
            title: "Warning",
            description: "No Search Console sites found for your account. Please make sure you have access to Search Console properties.",
            variant: "destructive",
          });
        }
        
        setGscAccounts(
          gscData.siteEntry?.map((s: any) => ({
            id: s.siteUrl,
            name: s.siteUrl,
          })) || []
        );

        toast({
          title: "Success",
          description: "Successfully connected to Google services",
        });

      } catch (error: any) {
        handleApiError(error, error.message.includes("GA4") ? "Google Analytics" : "Search Console");
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
  });

  return (
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

        {gaAccounts.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select Google Analytics Account
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
      </CardContent>
    </Card>
  );
}
