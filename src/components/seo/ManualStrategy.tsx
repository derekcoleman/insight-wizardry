import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ManualInput {
  targetAudience: string;
  additionalInfo: string;
}

export function ManualStrategy() {
  const [input, setInput] = useState<ManualInput>({
    targetAudience: '',
    additionalInfo: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.targetAudience) {
      toast({
        title: "Error",
        description: "Please specify a target audience",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('generate-seo-strategy', {
        body: { manualInput: input }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setInput({
        targetAudience: '',
        additionalInfo: ''
      });
      
      toast({
        title: "Input Received",
        description: "Your input has been processed and will be used to generate SEO recommendations.",
      });
    } catch (error) {
      console.error('Error submitting manual input:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your input",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Input</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Textarea
                id="targetAudience"
                value={input.targetAudience}
                onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
                placeholder="Describe your target audience (e.g., Marketing Managers, Business Owners, age groups, interests)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={input.additionalInfo}
                onChange={(e) => setInput({ ...input, additionalInfo: e.target.value })}
                placeholder="Any additional context or requirements for your SEO strategy"
              />
            </div>

            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Submit Input
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}