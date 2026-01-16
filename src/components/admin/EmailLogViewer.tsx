import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Mail, Search, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  notification_type: string;
  subject: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const notificationTypeLabels: Record<string, string> = {
  welcome: 'Willkommen',
  status_approved: 'Freigeschaltet',
  status_rejected: 'Abgelehnt',
  status_pending: 'In Prüfung',
  order_created: 'Anfrage erhalten',
  order_confirmed: 'Angebot erstellt',
  order_processing: 'In Bearbeitung',
  order_shipped: 'Versendet',
  order_delivered: 'Abgeschlossen',
  order_cancelled: 'Storniert',
  document_uploaded: 'Neues Dokument',
};

export const EmailLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setLogs((data as EmailLog[]) || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || log.notification_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const uniqueTypes = [...new Set(logs.map((log) => log.notification_type))];

  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail-Protokoll
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">
              <CheckCircle className="h-3 w-3 mr-1" />
              {sentCount} gesendet
            </Badge>
            {failedCount > 0 && (
              <Badge variant="secondary" className="bg-red-500/20 text-red-700 dark:text-red-400">
                <XCircle className="h-3 w-3 mr-1" />
                {failedCount} fehlgeschlagen
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle Typen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {notificationTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery || typeFilter !== 'all'
              ? 'Keine E-Mails gefunden.'
              : 'Noch keine E-Mails gesendet.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Empfänger</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Betreff</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.recipient_name || '-'}</div>
                      <div className="text-sm text-muted-foreground">{log.recipient_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {notificationTypeLabels[log.notification_type] || log.notification_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={log.subject}>
                    {log.subject}
                  </TableCell>
                  <TableCell>
                    {log.status === 'sent' ? (
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Gesendet
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="cursor-help"
                        title={log.error_message || 'Unbekannter Fehler'}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Fehler
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
