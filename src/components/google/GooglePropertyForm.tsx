import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface Account {
  id: string;
  name: string;
}

interface ConversionGoal {
  id: string;
  name: string;
}

interface GooglePropertyFormProps {
  gaAccounts: Account[];
  gscAccounts: Account[];
  conversionGoals: ConversionGoal[];
  isAnalyzing: boolean;
  onAnalyze: (gaProperty: string, gscProperty: string, goal: string) => void;
  fetchConversionGoals: (propertyId: string) => Promise<void>;
}

export function GooglePropertyForm({
  gaAccounts,
  gscAccounts,
  conversionGoals,
  isAnalyzing,
  onAnalyze,
  fetchConversionGoals,
}: GooglePropertyFormProps) {
  const [selectedGaAccount, setSelectedGaAccount] = useState<string>("");
  const [selectedGscAccount, setSelectedGscAccount] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const { toast } = useToast();

  const handleGaAccountChange = async (value: string) => {
    try {
      setSelectedGaAccount(value);
      setSelectedGoal("");
      
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

  const handleAnalyze = () => {
    if (!selectedGaAccount) {
      toast({
        title: "Error",
        description: "Please select a Google Analytics property first.",
        variant: "destructive",
      });
      return;
    }
    onAnalyze(selectedGaAccount, selectedGscAccount, selectedGoal);
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
}