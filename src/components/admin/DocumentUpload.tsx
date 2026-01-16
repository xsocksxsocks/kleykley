import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2, Loader2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
}

interface UserDocument {
  id: string;
  user_id: string;
  name: string;
  document_type: string;
  file_url: string;
  file_size: number | null;
  uploaded_at: string;
  profiles?: Profile;
}

const documentTypeLabels: Record<string, string> = {
  invoice: 'Rechnung',
  contract: 'Vertrag',
  certificate: 'Zertifikat',
  other: 'Sonstige',
};

export const DocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState<string>('invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch approved customers
      const { data: customersData } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name')
        .eq('approval_status', 'approved')
        .order('company_name', { ascending: true });
      
      setCustomers(customersData || []);

      // Fetch all documents with customer info
      const { data: documentsData } = await supabase
        .from('user_documents')
        .select('*')
        .order('uploaded_at', { ascending: false });
      
      // Fetch customer info separately
      if (documentsData && documentsData.length > 0) {
        const userIds = [...new Set(documentsData.map(d => d.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name, company_name')
          .in('id', userIds);
        
        const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
        const docsWithProfiles = documentsData.map(doc => ({
          ...doc,
          profiles: profilesMap.get(doc.user_id),
        }));
        setDocuments(docsWithProfiles as UserDocument[]);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedCustomer || !documentName || !selectedFile || !user) {
      toast({
        title: 'Fehler',
        description: 'Bitte alle Felder ausfüllen.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedCustomer}/${Date.now()}-${documentName}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: selectedCustomer,
          name: documentName,
          document_type: documentType,
          file_url: fileName,
          file_size: selectedFile.size,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      // Send email notification to customer
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer?.email) {
        try {
          await supabase.functions.invoke('send-customer-notification', {
            body: {
              type: 'document_uploaded',
              customerEmail: customer.email,
              customerName: customer.full_name || customer.company_name || 'Kunde',
              data: {
                documentName: documentName,
              },
            },
          });
          console.log('Document notification email sent');
        } catch (emailError) {
          console.error('Failed to send document notification:', emailError);
        }
      }

      toast({
        title: 'Dokument hochgeladen',
        description: 'Das Dokument wurde erfolgreich hochgeladen und der Kunde wurde benachrichtigt.',
      });

      // Reset form and refresh
      setSelectedCustomer('');
      setDocumentName('');
      setDocumentType('invoice');
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Fehler',
        description: 'Dokument konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: UserDocument) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('user-documents')
        .remove([doc.file_url]);

      // Delete record
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', doc.id);

      if (error) throw error;

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      
      toast({
        title: 'Dokument gelöscht',
        description: 'Das Dokument wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Fehler',
        description: 'Dokument konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCustomerLabel = (profile: Profile) => {
    return profile.company_name || profile.full_name || profile.email;
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchQuery) return true;
    const customer = doc.profiles;
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(searchLower) ||
      customer?.company_name?.toLowerCase().includes(searchLower) ||
      customer?.full_name?.toLowerCase().includes(searchLower) ||
      customer?.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Dokument hochladen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Kunde</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {getCustomerLabel(customer)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dokumenttyp</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Rechnung</SelectItem>
                  <SelectItem value="contract">Vertrag</SelectItem>
                  <SelectItem value="certificate">Zertifikat</SelectItem>
                  <SelectItem value="other">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dokumentname</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="z.B. Rechnung 2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Datei</Label>
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedCustomer || !documentName || !selectedFile}
            className="mt-4"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Hochladen
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hochgeladene Dokumente ({documents.length})
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Keine Dokumente vorhanden.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Dokument</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Hochgeladen</TableHead>
                  <TableHead className="w-20">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      {doc.profiles ? getCustomerLabel(doc.profiles as Profile) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(doc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
