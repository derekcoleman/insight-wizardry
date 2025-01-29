import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface GoogleAuthCheckProps {
  userEmail: string | null;
  children: React.ReactNode;
}

export function GoogleAuthCheck({ userEmail, children }: GoogleAuthCheckProps) {
  const [authChecking, setAuthChecking] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Handle initial auth state and setup listener
  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: initialSession, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (mounted) {
          console.log("Initial auth state:", { session: initialSession.session });
          setSession(initialSession.session);
        }

        // Setup auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", { event, session });
          
          if (mounted) {
            setSession(session);
            
            if (event === 'SIGNED_IN') {
              toast({
                title: "Signed in successfully",
                description: "Welcome back!",
              });
            } else if (event === 'SIGNED_OUT') {
              toast({
                title: "Signed out",
                description: "You have been signed out.",
              });
            }
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error("Auth setup error:", error);
        setError(error.message);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    };

    setupAuth();
  }, [toast]);

  // Handle profile creation/check
  useEffect(() => {
    let mounted = true;

    const checkProfile = async () => {
      try {
        if (!session?.user?.id || !userEmail) {
          console.log("Skipping profile check - no session or email:", { 
            hasSession: !!session?.user?.id, 
            userEmail 
          });
          return;
        }

        console.log("Checking profile for:", { userId: session.user.id, userEmail });
        
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!existingProfile && mounted) {
          console.log("Creating new profile for:", userEmail);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: userEmail
            });

          if (insertError) throw insertError;

          toast({
            title: "Profile Created",
            description: "Your profile has been set up successfully.",
          });
        }
      } catch (error: any) {
        console.error("Profile error:", error);
        setError(error.message);
        toast({
          title: "Profile Error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    checkProfile();

    return () => {
      mounted = false;
    };
  }, [session, userEmail, toast]);

  if (error) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="space-y-4 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (authChecking) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Verifying authentication...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}