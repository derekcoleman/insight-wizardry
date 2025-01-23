import { Link } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader } from "@/components/ui/sidebar";
import { Home, LineChart, PanelLeftClose } from "lucide-react";

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

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader className="border-b border-sidebar-border">
              <div className="flex justify-end p-2">
                <SidebarTrigger>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <PanelLeftClose className="h-4 w-4" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </SidebarTrigger>
              </div>
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

        <div className="flex-1">
          <nav className="bg-[#221F26] shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <Link to="/" className="ml-4">
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
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}