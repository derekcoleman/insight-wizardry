import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ApiKeyInput() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>OpenAI API Key</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The OpenAI API key is securely stored in the backend.
        </p>
      </CardContent>
    </Card>
  );
}