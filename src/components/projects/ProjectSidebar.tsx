
import { useState, useEffect } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useSavedAudits } from "@/hooks/useSavedAudits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, FileText, Target, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ProjectSidebarProps {
  onSelectAnalysis?: (analysisData: any) => void;
  onSelectStrategy?: (strategyData: any) => void;
  onSelectAudit?: (auditData: any) => void;
}

export function ProjectSidebar({ onSelectAnalysis, onSelectStrategy, onSelectAudit }: ProjectSidebarProps) {
  const { projects, isLoading, getProjectAnalyses, getProjectStrategies } = useProjects();
  const { savedAudits } = useSavedAudits();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectData, setProjectData] = useState<Record<string, { analyses: any[], strategies: any[], audits: any[] }>>({});

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

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          Projects
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 w-6 p-0"
            onClick={() => {/* TODO: Implement create project modal */}}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No projects yet. Run an analysis to create your first project.
          </p>
        ) : (
          projects.map((project) => (
            <Collapsible
              key={project.id}
              open={expandedProjects.has(project.id)}
              onOpenChange={() => toggleProject(project.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 hover:bg-accent"
                >
                  {expandedProjects.has(project.id) ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{project.name}</span>
                    <span className="text-xs text-muted-foreground">{project.url}</span>
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 space-y-1">
                {projectData[project.id]?.audits.map((audit) => (
                  <Button
                    key={audit.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2 hover:bg-accent"
                    onClick={() => onSelectAudit?.(audit)}
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs">Audit</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(audit.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </Button>
                ))}
                {projectData[project.id]?.analyses.map((analysis) => (
                  <Button
                    key={analysis.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2 hover:bg-accent"
                    onClick={() => onSelectAnalysis?.(analysis.analysis_data)}
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs">Analysis</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(analysis.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </Button>
                ))}
                {projectData[project.id]?.strategies.map((strategy) => (
                  <Button
                    key={strategy.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-auto p-2 hover:bg-accent"
                    onClick={() => onSelectStrategy?.(strategy.strategy_data)}
                  >
                    <Target className="h-3 w-3 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs">SEO Strategy</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(strategy.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
}
