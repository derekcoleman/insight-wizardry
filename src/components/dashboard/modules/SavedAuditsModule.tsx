
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SavedAudit {
  id: string;
  title: string;
  description: string | null;
  audit_type: string;
  created_at: string;
  website_url: string | null;
}

export function SavedAuditsModule() {
  const { user } = useAuth();
  const [audits, setAudits] = useState<SavedAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAudits();
    }
  }, [user]);

  const fetchAudits = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_audits')
        .select('id, title, description, audit_type, created_at, website_url')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Saved Audits
          </CardTitle>
          <CardDescription>
            Sign in to view your saved audits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Please sign in to access your audit history
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Saved Audits
        </CardTitle>
        <CardDescription>
          Your recent audit history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : audits.length > 0 ? (
          <div className="space-y-2">
            {audits.map((audit) => (
              <div key={audit.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="font-medium text-sm">{audit.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(audit.created_at).toLocaleDateString()}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No saved audits yet</p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Start New Audit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
