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
import { Loader2 } from "lucide-react";

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
  const { toast } = useToast();

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setIsLoading(true);
      try {
        // Fetch GA4 accounts
        const gaResponse = await fetch(
          "https://analyticsdata.googleapis.com/v1beta/properties",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );
        const gaData = await gaResponse.json();
        setGaAccounts(
          gaData.properties?.map((p: any) => ({
            id: p.name,
            name: p.displayName,
          })) || []
        );

        // Fetch Search Console sites
        const gscResponse = await fetch(
          "https://www.googleapis.com/webmasters/v3/sites",
          {
            headers: {
              Authorization: `Bearer ${response.access_token}`,
            },
          }
        );
        const gscData = await gscResponse.json();
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
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch account data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    scope:
      "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connect Google Services</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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