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
import { useToast } from "@/hooks/use-toast";
import { GoogleConnect } from "@/components/GoogleConnect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertySelector } from "@/components/PropertySelector";
import { ConversionGoalSelector } from "@/components/ConversionGoalSelector";
import { useGoogleServices } from "@/hooks/useGoogleServices";

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
  const [selectedGaAccount, setSelectedGaAccount] = useState("");
  const [selectedGscAccount, setSelectedGscAccount] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const { toast } = useToast();

  const {
    gaAccounts,
    gscAccounts,
    conversionGoals,
    isLoading: isGoogleLoading,
    error: googleError,
    gaConnected,
    gscConnected,
    handleLogin,
    fetchConversionGoals,
    accessToken
  } = useGoogleServices();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const { data: projects, refetch: refetchProjects } = useQuery({
    queryKey: ["projects"],
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

    if (!selectedGaAccount) {
      toast({
        title: "GA4 Property Required",
        description: "Please select a Google Analytics 4 property.",
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

      // Save the selected properties as connections
      if (selectedGaAccount) {
        await supabase.from("project_connections").insert({
          project_id: project.id,
          service_type: 'ga4',
          connection_data: {
            property_id: selectedGaAccount,
            conversion_goal: selectedGoal
          },
          status: 'active'
        });
      }

      if (selectedGscAccount) {
        await supabase.from("project_connections").insert({
          project_id: project.id,
          service_type: 'gsc',
          connection_data: {
            property_url: selectedGscAccount
          },
          status: 'active'
        });
      }

      // Run initial analysis
      const response = await supabase.functions.invoke('analyze-ga4-data', {
        body: {
          ga4Property: selectedGaAccount,
          gscProperty: selectedGscAccount,
          accessToken,
          mainConversionGoal: selectedGoal || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to analyze data');
      }

      // Save analysis results
      await supabase.from("analytics_reports").insert({
        user_id: session.user.id,
        project_id: project.id,
        ga4_property: selectedGaAccount,
        gsc_property: selectedGscAccount,
        weekly_analysis: response.data.report.weekly_analysis,
        monthly_analysis: response.data.report.monthly_analysis,
        quarterly_analysis: response.data.report.quarterly_analysis,
        yoy_analysis: response.data.report.last28_yoy_analysis,
        status: 'completed'
      });

      toast({
        title: "Project created successfully",
        description: `${name} has been added to your projects.`,
      });

      setOpen(false);
      setName("");
      setUrl("");
      setActiveTab("details");
      setSelectedGaAccount("");
      setSelectedGscAccount("");
      setSelectedGoal("");
      refetchProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleGaAccountChange = async (value: string) => {
    setSelectedGaAccount(value);
    setSelectedGoal("");
    
    if (value) {
      console.log("Fetching conversion goals for GA4 property:", value);
      await fetchConversionGoals(value);
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
                <TabsTrigger value="connect" disabled={!gaConnected}>
                  Select Properties
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                {!gaConnected ? (
                  <GoogleConnect />
                ) : (
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
                    <Button 
                      type="button" 
                      className="w-full"
                      onClick={() => setActiveTab('connect')}
                    >
                      Next: Select Properties
                    </Button>
                  </form>
                )}
              </TabsContent>
              <TabsContent value="connect">
                <div className="space-y-4">
                  <PropertySelector
                    label="Select Google Analytics 4 Property"
                    accounts={gaAccounts}
                    value={selectedGaAccount}
                    onValueChange={handleGaAccountChange}
                    placeholder="Select GA4 property"
                  />

                  {conversionGoals.length > 0 && (
                    <ConversionGoalSelector
                      goals={conversionGoals}
                      value={selectedGoal}
                      onValueChange={setSelectedGoal}
                    />
                  )}

                  {gscAccounts.length > 0 && (
                    <PropertySelector
                      label="Select Search Console Property"
                      accounts={gscAccounts}
                      value={selectedGscAccount}
                      onValueChange={setSelectedGscAccount}
                      placeholder="Select Search Console property"
                    />
                  )}

                  <Button 
                    onClick={handleCreateProject}
                    disabled={!selectedGaAccount || isGoogleLoading}
                    className="w-full"
                  >
                    Create Project
                  </Button>
                </div>
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
                {['ga4', 'gsc'].map(service => {
                  const connection = getConnectionStatus(project.id, service);
                  return (
                    <Badge 
                      key={service}
                      variant={connection?.status === 'active' ? 'default' : 'secondary'}
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
                    View Analysis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Analysis Results - {project.name}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <GoogleConnect />
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