import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Folder, Link, Database, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { GoogleConnect } from "@/components/GoogleConnect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Project {
  id: string;
  name: string;
  url: string | null;
  created_at: string;
  user_id: string;
}

interface Connection {
  id: string;
  service_type: string;
  status: string | null;
  last_refreshed_at: string | null;
}

export function ProjectList() {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: connections } = useQuery({
    queryKey: ["connections", selectedProject],
    enabled: !!selectedProject,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_connections")
        .select("*")
        .eq("project_id", selectedProject);

      if (error) throw error;
      return data as Connection[];
    },
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a project.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: project, error } = await supabase.from("projects").insert({
        name,
        url,
        user_id: session.user.id,
      }).select().single();

      if (error) throw error;

      toast({
        title: "Project created successfully",
        description: `${name} has been added to your projects.`,
      });

      setSelectedProject(project.id);
      setActiveTab("connect");
      refetchProjects();
    } catch (error) {
      toast({
        title: "Error creating project",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAnalysisComplete = async (projectId: string, data: any) => {
    try {
      // Save the analysis results to the project
      const { error } = await supabase.from("analytics_reports").insert({
        user_id: session?.user?.id,
        ga4_property: data.ga4Property,
        gsc_property: data.gscProperty,
        weekly_analysis: data.report.weekly_analysis,
        monthly_analysis: data.report.monthly_analysis,
        quarterly_analysis: data.report.quarterly_analysis,
        yoy_analysis: data.report.last28_yoy_analysis,
      });

      if (error) throw error;

      toast({
        title: "Analysis complete",
        description: "The report has been saved to your project.",
      });

      setOpen(false);
      setName("");
      setUrl("");
      setActiveTab("details");
      refetchProjects();
    } catch (error) {
      toast({
        title: "Error saving analysis",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getConnectionStatus = (projectId: string, serviceType: string) => {
    if (!connections) return null;
    return connections.find(c => c.service_type === serviceType);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Project Details</TabsTrigger>
                <TabsTrigger value="connect" disabled={!selectedProject}>
                  Connect Services
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Project Name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Website"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">
                      Website URL
                    </label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      type="url"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Project
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="connect">
                <GoogleConnect 
                  onConnectionChange={(connected) => {
                    if (connected) {
                      toast({
                        title: "Connection successful",
                        description: "Google services have been connected to your project.",
                      });
                    }
                  }}
                  onAnalysisComplete={(data) => {
                    if (selectedProject) {
                      handleAnalysisComplete(selectedProject, data);
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <Card key={project.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{project.name}</h3>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:underline flex items-center"
                  >
                    <Link className="mr-1 h-3 w-3" />
                    {project.url}
                  </a>
                )}
              </div>
              <Folder className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                {['ga4', 'gsc', 'meta', 'google-ads'].map(service => {
                  const connection = getConnectionStatus(project.id, service);
                  return (
                    <Badge 
                      key={service}
                      variant={connection?.status === 'active' ? 'success' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {connection?.status === 'active' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {service.toUpperCase()}
                    </Badge>
                  );
                })}
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Manage Connections
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Connect APIs - {project.name}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <GoogleConnect 
                      onConnectionChange={(connected) => {
                        if (connected) {
                          toast({
                            title: "Connection successful",
                            description: "Google services have been connected to your project.",
                          });
                        }
                      }}
                      onAnalysisComplete={(data) => handleAnalysisComplete(project.id, data)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}
        {projects?.length === 0 && (
          <Card className="col-span-full p-6">
            <div className="text-center text-muted-foreground">
              <p>No projects yet. Create your first project to get started!</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}