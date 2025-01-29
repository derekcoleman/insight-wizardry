import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";

interface GoogleAuthButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function GoogleAuthButton({ onClick, isLoading }: GoogleAuthButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Mail className="h-4 w-4 mr-2" />
      )}
      Connect Google Services
    </Button>
  );
}