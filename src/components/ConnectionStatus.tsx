import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface ConnectionStatusProps {
  gaConnected: boolean;
  gscConnected: boolean;
}

export function ConnectionStatus({ gaConnected, gscConnected }: ConnectionStatusProps) {
  if (!gaConnected && !gscConnected) return null;

  return (
    <Alert>
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Connected Services</AlertTitle>
      <AlertDescription>
        {gaConnected && "✓ Google Analytics 4"}
        {gaConnected && gscConnected && <br />}
        {gscConnected && "✓ Search Console"}
      </AlertDescription>
    </Alert>
  );
}