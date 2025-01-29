import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface ConnectionStatusProps {
  gaConnected: boolean;
  gscConnected: boolean;
  gmailConnected: boolean;
}

export function ConnectionStatus({ gaConnected, gscConnected, gmailConnected }: ConnectionStatusProps) {
  if (!gaConnected && !gscConnected && !gmailConnected) return null;

  return (
    <Alert>
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>Connected Services</AlertTitle>
      <AlertDescription>
        {gaConnected && "✓ Google Analytics 4"}
        {gaConnected && (gscConnected || gmailConnected) && <br />}
        {gscConnected && "✓ Search Console"}
        {gscConnected && gmailConnected && <br />}
        {gmailConnected && "✓ Gmail"}
      </AlertDescription>
    </Alert>
  );
}