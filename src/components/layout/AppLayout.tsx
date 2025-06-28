
import { Link, useLocation } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { Home, LineChart, PanelLeft, FileText, Trash2, BarChart3, Folder, ChevronDown, ChevronRight, Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedAudits } from "@/hooks/useSavedAudits";
import { useProjects } from "@/hooks/useProjects";
import { useState, useEffect } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
          <div className="flex items-center">
            <AuthButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { savedAudits, deleteAudit } = useSavedAudits();
  const { projects, isLoading, getProjectAnalyses, getProjectStrategies } = useProjects();
  const [hasGeneratedStrategy, setHasGeneratedStrategy] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectData, setProjectData] = useState<Record<string, { analyses: any[], strategies: any[], audits: any[] }>>({});
  const location = useLocation();

  // Check if user has generated a strategy
  useEffect(() => {
    const storedStrategy = localStorage.getItem('generatedStrategy');
    setHasGeneratedStrategy(!!storedStrategy);
  }, [location.pathname]);

  // Group audits by website domain to match with projects
  const groupAuditsByDomain = () => {
    const auditsByDomain: Record<string, any[]> = {};
    
    savedAudits.forEach(audit => {
      if (audit.website_url) {
        try {
          const domain = new URL(audit.website_url).hostname;
          if (!auditsByDomain[domain]) {
            auditsByDomain[domain] = [];
          }
          auditsByDomain[domain].push(audit);
        } catch {
          // If URL parsing fails, use the website_url as is
          if (!auditsByDomain[audit.website_url]) {
            auditsByDomain[audit.website_url] = [];
          }
          auditsByDomain[audit.website_url].push(audit);
        }
      }
    });
    
    return auditsByDomain;
  };

  const toggleProject = async (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
      
      // Load project data if not already loaded
      if (!projectData[projectId]) {
        const [analyses, strategies] = await Promise.all([
          getProjectAnalyses(projectId),
          getProjectStrategies(projectId)
        ]);

        // Get audits for this project based on domain matching
        const project = projects.find(p => p.id === projectId);
        const auditsByDomain = groupAuditsByDomain();
        let projectAudits: any[] = [];
        
        if (project?.url) {
          try {
            const domain = new URL(project.url).hostname;
            projectAudits = auditsByDomain[domain] || [];
          } catch {
            projectAudits = auditsByDomain[project.url] || [];
          }
        }
        
        setProjectData(prev => ({
          ...prev,
          [projectId]: { analyses, strategies, audits: projectAudits }
        }));
      }
    }
    
    setExpandedProjects(newExpanded);
  };

  const handleAuditClick = (audit: any) => {
    // Store the selected audit data for the dashboard to use
    localStorage.setItem('selectedAudit', JSON.stringify(audit));
    // Navigate to dashboard if not already there
    if (location.pathname !== '/dashboard') {
      window.location.href = '/dashboard';
    } else {
      // Trigger a custom event to notify the dashboard of the selection
      window.dispatchEvent(new CustomEvent('auditSelected', { detail: audit }));
    }
  };

  const handleAnalysisClick = (analysisData: any) => {
    if (location.pathname !== '/dashboard') {
      window.location.href = '/dashboard';
    } else {
      window.dispatchEvent(new CustomEvent('analysisSelected', { detail: analysisData }));
    }
  };

  const handleStrategyClick = (strategyData: any) => {
    if (location.pathname !== '/dashboard') {
      window.location.href = '/dashboard';
    } else {
      window.dispatchEvent(new CustomEvent('strategySelected', { detail: strategyData }));
    }
  };

  const mainItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
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

            {/* Projects Section */}
            {user && projects.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="px-2 py-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-sidebar-foreground/70">Projects</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {/* TODO: Implement create project modal */}}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <SidebarMenu>
                      {projects.map((project) => (
                        <SidebarMenuItem key={project.id}>
                          <Collapsible
                            open={expandedProjects.has(project.id)}
                            onOpenChange={() => toggleProject(project.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="w-full justify-start">
                                {expandedProjects.has(project.id) ? (
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 mr-2" />
                                )}
                                <Folder className="h-4 w-4 mr-2" />
                                <div className="flex flex-col items-start">
                                  <span className="font-medium text-sm">{project.name}</span>
                                  <span className="text-xs text-muted-foreground">{project.url}</span>
                                </div>
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="ml-6 space-y-1">
                              {projectData[project.id]?.audits.map((audit) => (
                                <SidebarMenuButton
                                  key={audit.id}
                                  onClick={() => handleAuditClick(audit)}
                                  className="w-full justify-start text-xs"
                                >
                                  <FileText className="h-3 w-3 mr-2" />
                                  <div className="flex flex-col items-start">
                                    <span>Audit</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(audit.created_at), 'MMM d, HH:mm')}
                                    </span>
                                  </div>
                                </SidebarMenuButton>
                              ))}
                              {projectData[project.id]?.analyses.map((analysis) => (
                                <SidebarMenuButton
                                  key={analysis.id}
                                  onClick={() => handleAnalysisClick(analysis.analysis_data)}
                                  className="w-full justify-start text-xs"
                                >
                                  <FileText className="h-3 w-3 mr-2" />
                                  <div className="flex flex-col items-start">
                                    <span>Analysis</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(analysis.created_at), 'MMM d, HH:mm')}
                                    </span>
                                  </div>
                                </SidebarMenuButton>
                              ))}
                              {projectData[project.id]?.strategies.map((strategy) => (
                                <SidebarMenuButton
                                  key={strategy.id}
                                  onClick={() => handleStrategyClick(strategy.strategy_data)}
                                  className="w-full justify-start text-xs"
                                >
                                  <Target className="h-3 w-3 mr-2" />
                                  <div className="flex flex-col items-start">
                                    <span>SEO Strategy</span>
                                    <span className="text-muted-foreground">
                                      {format(new Date(strategy.created_at), 'MMM d, HH:mm')}
                                    </span>
                                  </div>
                                </SidebarMenuButton>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Saved Audits Section - Only show audits not associated with projects */}
            {user && savedAudits.length > 0 && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <div className="px-2 py-1">
                    <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-2">Other Audits</h3>
                    <SidebarMenu>
                      {savedAudits.filter(audit => {
                        // Only show audits that don't belong to any project
                        if (!audit.website_url) return true;
                        
                        try {
                          const domain = new URL(audit.website_url).hostname;
                          return !projects.some(p => p.url && p.url.includes(domain));
                        } catch {
                          return !projects.some(p => p.url === audit.website_url);
                        }
                      }).slice(0, 10).map((audit) => (
                        <SidebarMenuItem key={audit.id}>
                          <SidebarMenuButton asChild>
                            <div className="flex items-center justify-between w-full p-2 hover:bg-sidebar-accent rounded-md group cursor-pointer">
                              <div 
                                className="flex items-center gap-2 flex-1 min-w-0"
                                onClick={() => handleAuditClick(audit)}
                              >
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
