import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Loader2, 
  FolderOpen,
  FileCheck,
  FileSignature,
  FileBadge,
  File
} from 'lucide-react';

interface UserDocument {
  id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  uploaded_at: string;
}

const documentTypeLabels: Record<string, string> = {
  invoice: 'Rechnung',
  contract: 'Vertrag',
  certificate: 'Zertifikat',
  other: 'Sonstige',
};

const documentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  invoice: FileCheck,
  contract: FileSignature,
  certificate: FileBadge,
  other: File,
};

const documentTypeColors: Record<string, string> = {
  invoice: 'bg-green-500/20 text-green-700 dark:text-green-400',
  contract: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  certificate: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  other: 'bg-muted text-muted-foreground',
};

const Dokumente = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/portal/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (document: UserDocument) => {
    try {
      // Get signed URL for private bucket
      const { data, error } = await supabase.storage
        .from('user-documents')
        .createSignedUrl(document.file_url, 60);

      if (error) throw error;
      
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    const type = doc.document_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, UserDocument[]>);

  if (authLoading || loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-gold" />
          <h1 className="text-3xl font-serif font-bold text-foreground">Meine Dokumente</h1>
        </div>

        {documents.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Keine Dokumente vorhanden</h2>
            <p className="text-muted-foreground">
              Hier werden Ihre Rechnungen, Verträge und andere Dokumente angezeigt.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedDocuments).map(([type, docs]) => {
              const Icon = documentTypeIcons[type] || File;
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {documentTypeLabels[type] || type}
                      <Badge variant="secondary">{docs.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded ${documentTypeColors[doc.document_type]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(doc.uploaded_at)}
                                {doc.file_size && ` • ${formatFileSize(doc.file_size)}`}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Herunterladen
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default Dokumente;
