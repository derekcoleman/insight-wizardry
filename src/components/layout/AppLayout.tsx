
import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Home, LineChart, PanelLeft, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedAudits } from "@/hooks/useSavedAudits";
import { useState, useEffect } from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function NavHeader() {
  const { toggleSidebar } = useSidebar();
  
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
        </div>
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { savedAudits, deleteAudit } = useSavedAudits();
  const [hasGeneratedStrategy, setHasGeneratedStrategy] = useState(false);
  const location = useLocation();

  // Check if user has generated a strategy
  useEffect(() => {
    const storedStrategy = localStorage.getItem('generatedStrategy');
    setHasGeneratedStrategy(!!storedStrategy);
  }, [location.pathname]);

  const mainItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
  ];

  // Only show SEO Strategy if user has generated one
  if (hasGeneratedStrategy) {
    mainItems.push({
      title: "SEO Strategy",
      url: "/seo-strategy",
      icon: LineChart,
    });
  }

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
                  {mainItems.map((item) => (
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

            {/* Saved Audits Section */}
            {user && savedAudits.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="px-2 py-1">
                    <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-2">Saved Audits</h3>
                    <SidebarMenu>
                      {savedAudits.slice(0, 10).map((audit) => (
                        <SidebarMenuItem key={audit.id}>
                          <SidebarMenuButton asChild>
                            <div className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent rounded-md group">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate text-sm" title={audit.title}>
                                  {audit.title}
                                </span>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Audit</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{audit.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteAudit(audit.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
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
