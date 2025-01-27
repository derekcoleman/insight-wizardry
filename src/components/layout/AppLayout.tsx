import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, useSidebar, SidebarGroupLabel, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { BarChart3, ChevronRight, FileText, Grid, LineChart, Mail, MessageSquareShare, PanelLeft, Share2, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  {
    title: "Growth",
    icon: TrendingUp,
    items: [
      { title: "Analysis", path: "/?tab=growth", icon: FileText },
    ],
  },
  {
    title: "SEM",
    icon: Grid,
    items: [
      {
        title: "Organic Search",
        icon: LineChart,
        items: [
          { title: "Analysis", path: "/?tab=organic-search", icon: FileText },
          { title: "SEO Strategy", path: "/seo-strategy", icon: Target },
        ],
      },
      {
        title: "Paid Search",
        icon: BarChart3,
        items: [
          { title: "Analysis", path: "/?tab=paid-search", icon: FileText },
        ],
      },
    ],
  },
  {
    title: "Social",
    icon: MessageSquareShare,
    items: [
      {
        title: "Organic Social",
        icon: MessageSquareShare,
        items: [
          { title: "Analysis", path: "/?tab=organic-social", icon: FileText },
        ],
      },
      {
        title: "Paid Social",
        icon: Share2,
        items: [
          { title: "Analysis", path: "/?tab=paid-social", icon: FileText },
        ],
      },
    ],
  },
  {
    title: "Email",
    icon: Mail,
    items: [
      { title: "Analysis", path: "/?tab=email", icon: FileText },
    ],
  },
];

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

function SidebarNavigation() {
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const renderMenuItems = (items: any[], level = 0) => {
    return items.map((item) => (
      <SidebarMenuItem key={item.title}>
        {item.items ? (
          <>
            <SidebarMenuButton className={cn("gap-2", level > 0 && "pl-4")}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
            <SidebarMenuSub>
              {renderMenuItems(item.items, level + 1)}
            </SidebarMenuSub>
          </>
        ) : (
          <SidebarMenuSubButton
            asChild
            isActive={currentPath === item.path}
            className={cn(level > 0 && "pl-4")}
          >
            <Link to={item.path}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuSubButton>
        )}
      </SidebarMenuItem>
    ));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {renderMenuItems(items)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader className="border-b border-sidebar-border">
              <div className="flex justify-end p-2" />
            </SidebarHeader>
            <SidebarNavigation />
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