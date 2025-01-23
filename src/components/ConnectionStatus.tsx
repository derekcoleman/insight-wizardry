import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface ConnectionStatusProps {
  gaConnected: boolean;
  gscConnected: boolean;
  adsConnected: boolean;
}

export function ConnectionStatus({ gaConnected, gscConnected, adsConnected }: ConnectionStatusProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Badge variant={gaConnected ? "default" : "secondary"} className="flex gap-1 items-center">
        {gaConnected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        Google Analytics
      </Badge>
      <Badge variant={gscConnected ? "default" : "secondary"} className="flex gap-1 items-center">
        {gscConnected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        Search Console
      </Badge>
      <Badge variant={adsConnected ? "default" : "secondary"} className="flex gap-1 items-center">
        {adsConnected ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
        Google Ads
      </Badge>
    </div>
  );
}