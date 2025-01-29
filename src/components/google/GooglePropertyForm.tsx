import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
    if (!selectedGaAccount || !selectedGscAccount || !selectedGoal) {
      toast({
        title: "Missing Required Fields",
        description: "Please select a GA4 property, Search Console property, and conversion goal.",
        variant: "destructive",
      });
      return;
    }
    onAnalyze(selectedGaAccount, selectedGscAccount, selectedGoal);
  };

  const allFieldsSelected = selectedGaAccount && selectedGscAccount && selectedGoal;

  return (
    <div className="space-y-6">
      {gaAccounts.length === 0 && gscAccounts.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Google Properties Found</AlertTitle>
          <AlertDescription>
            Please make sure you have access to GA4 and Search Console properties.
          </AlertDescription>
        </Alert>
      )}

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

      {selectedGaAccount && conversionGoals.length > 0 && (
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
            disabled={isAnalyzing || !allFieldsSelected}
            className="w-full"
          >
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {allFieldsSelected ? 'Analyze Data' : 'Select All Required Fields'}
          </Button>
        </div>
      )}
    </div>
  );
}