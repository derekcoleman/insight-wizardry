import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface SummaryProps {
  summary: string;
  isLoading: boolean;
}

export function Summary({ summary, isLoading }: SummaryProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Generating Summary...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated Summary</CardTitle>
        <Button variant="outline" onClick={copyToClipboard}>
          Copy
        </Button>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}