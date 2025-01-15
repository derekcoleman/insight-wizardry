import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export function ApiKeyInput() {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem("OPENAI_API_KEY");
    if (savedKey) setApiKey(savedKey);
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem("OPENAI_API_KEY", apiKey);
    toast({
      title: "Success",
      description: "API key saved successfully",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>OpenAI API Key</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Input
          type="password"
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Button onClick={saveApiKey}>Save Key</Button>
      </CardContent>
    </Card>
  );
}