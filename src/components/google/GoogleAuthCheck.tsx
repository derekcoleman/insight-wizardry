import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleAuthCheckProps {
  userEmail: string | null;
  children: React.ReactNode;
}

export function GoogleAuthCheck({ userEmail, children }: GoogleAuthCheckProps) {
  const [authChecking, setAuthChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const checkAuthAndCreateProfile = async () => {
      try {
        setAuthChecking(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (!session?.user?.id) {
          console.log('No authenticated user found - waiting for auth state to be ready');
          return;
        }

        if (userEmail) {
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', userEmail)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking profile:', fetchError);
            return;
          }

          if (!existingProfile) {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: userEmail
              });

            if (insertError) {
              console.error('Error creating profile:', insertError);
              toast({
                title: "Error",
                description: "Failed to create user profile",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Success",
                description: "Profile created successfully",
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in profile creation:', error);
        toast({
          title: "Error",
          description: "Failed to create user profile",
          variant: "destructive",
        });
      } finally {
        if (mounted) {
          setAuthChecking(false);
        }
      }
    };

    if (userEmail) {
      checkAuthAndCreateProfile();
    } else {
      setAuthChecking(false);
    }

    return () => {
      mounted = false;
    };
  }, [userEmail, toast]);

  if (authChecking) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Checking authentication status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}