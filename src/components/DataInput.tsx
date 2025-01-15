import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export function DataInput({ onSubmit }: { onSubmit: (data: string) => void }) {
  const [inputData, setInputData] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!inputData.trim()) {
      toast({
        title: "Error",
        description: "Please enter some data to summarize",
        variant: "destructive",
      });
      return;
    }
    onSubmit(inputData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analytics Data Input</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Paste your Google Analytics and Search Console data here..."
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          className="min-h-[200px] mb-4"
        />
        <Button onClick={handleSubmit} className="w-full">
          Generate Summary
        </Button>
      </CardContent>
    </Card>
  );
}