import { Link } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Home, LineChart, PanelLeft, UserRound, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "SEO Strategy",
    url: "/seo-strategy",
    icon: LineChart,
  },
];

function NavHeader() {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          setUserEmail(session.user.email);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching profile:", profileError);
          } else if (profileData) {
            console.log("Profile data:", profileData);
            setUserProfile(profileData);
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData) {
          setUserProfile(profileData);
        }
      } else {
        setUserEmail(null);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserEmail(null);
      setUserProfile(null);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <nav className="bg-[#221F26] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleSidebar}
              className="text-white hover:bg-white/10"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <Link to="/" className="ml-2">
              <img
                src="/lovable-uploads/5af14e23-a706-42a0-ac29-7d384fd42a15.png"
                alt="Standup Notez Logo"
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {!isLoading && userEmail && (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {userProfile?.google_oauth_data?.picture ? (
                        <AvatarImage 
                          src={userProfile.google_oauth_data.picture} 
                          alt={userProfile.google_oauth_data.name || userEmail} 
                        />
                      ) : (
                        <AvatarFallback>
                          <UserRound className="h-6 w-6" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {userProfile?.google_oauth_data?.name || userEmail}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserRound className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader className="border-b border-sidebar-border">
              <div className="flex justify-end p-2" />
            </SidebarHeader>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <NavHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
          <footer className="bg-white mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <nav className="flex justify-center space-x-8">
                <Link to="/privacy" className="text-gray-500 hover:text-gray-700">
                  Privacy Policy
                </Link>
                <Link to="/terms" className="text-gray-500 hover:text-gray-700">
                  Terms of Service
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}