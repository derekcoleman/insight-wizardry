import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

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
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FcGoogle className="h-4 w-4 mr-2" />
      )}
      Sign in with Google
    </Button>
  );
}