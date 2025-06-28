
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface SavedAudit {
  id: string;
  title: string;
  description?: string;
  audit_data: any;
  audit_type: string;
  status: string;
  ga4_property?: string;
  gsc_property?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

export function useSavedAudits() {
  const [savedAudits, setSavedAudits] = useState<SavedAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSavedAudits = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAudits(data || []);
    } catch (error) {
      console.error('Error fetching saved audits:', error);
      toast({
        title: "Error",
        description: "Failed to fetch saved audits",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAudit = async (auditData: {
    title: string;
    description?: string;
    audit_data: any;
    audit_type?: string;
    ga4_property?: string;
    gsc_property?: string;
    website_url?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('saved_audits')
        .insert({
          user_id: user.id,
          title: auditData.title,
          description: auditData.description,
          audit_data: auditData.audit_data,
          audit_type: auditData.audit_type || 'comprehensive',
          ga4_property: auditData.ga4_property,
          gsc_property: auditData.gsc_property,
          website_url: auditData.website_url,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedAudits(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Audit saved successfully",
      });

      return data;
    } catch (error) {
      console.error('Error saving audit:', error);
      toast({
        title: "Error",
        description: "Failed to save audit",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAudit = async (auditId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_audits')
        .delete()
        .eq('id', auditId);

      if (error) throw error;

      setSavedAudits(prev => prev.filter(audit => audit.id !== auditId));
      toast({
        title: "Success",
        description: "Audit deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting audit:', error);
      toast({
        title: "Error",
        description: "Failed to delete audit",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSavedAudits();
  }, [user]);

  return {
    savedAudits,
    isLoading,
    saveAudit,
    deleteAudit,
    refreshAudits: fetchSavedAudits
  };
}
