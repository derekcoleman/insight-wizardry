import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
      ) : null}
      Connect Google Account
    </Button>
  );
}