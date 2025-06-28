
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Project {
  id: string;
  name: string;
  url: string | null;
  analysis_status: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectAnalysis {
  id: string;
  project_id: string;
  analysis_data: any;
  analysis_type: string;
  created_at: string;
}

interface ProjectStrategy {
  id: string;
  project_id: string;
  strategy_data: any;
  created_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: {
    name: string;
    url?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectData.name,
          url: projectData.url,
        })
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Project created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveAnalysisToProject = async (projectId: string, analysisData: any, analysisType: string = 'comprehensive') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('project_analyses')
        .insert({
          project_id: projectId,
          analysis_data: analysisData,
          analysis_type: analysisType,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Analysis saved to project",
      });

      return data;
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveStrategyToProject = async (projectId: string, strategyData: any) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('project_strategies')
        .insert({
          project_id: projectId,
          strategy_data: strategyData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Strategy saved to project",
      });

      return data;
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "Failed to save strategy",
        variant: "destructive",
      });
      return null;
    }
  };

  const getProjectAnalyses = async (projectId: string): Promise<ProjectAnalysis[]> => {
    try {
      const { data, error } = await supabase
        .from('project_analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching project analyses:', error);
      return [];
    }
  };

  const getProjectStrategies = async (projectId: string): Promise<ProjectStrategy[]> => {
    try {
      const { data, error } = await supabase
        .from('project_strategies')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching project strategies:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return {
    projects,
    isLoading,
    createProject,
    saveAnalysisToProject,
    saveStrategyToProject,
    getProjectAnalyses,
    getProjectStrategies,
    refreshProjects: fetchProjects
  };
}
