import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Folder, Link, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export function ProjectList() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const { data: projects, refetch } = useQuery({
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("projects").insert([
        {
          name,
          url,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Project created successfully",
        description: `${name} has been added to your projects.`,
      });

      setOpen(false);
      setName("");
      setUrl("");
      refetch();
    } catch (error) {
      toast({
        title: "Error creating project",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
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
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="w-full">
                <Database className="mr-2 h-4 w-4" />
                Connections
              </Button>
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