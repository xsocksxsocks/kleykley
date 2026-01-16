import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Trash2, 
  Pencil,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface OrderNote {
  id: string;
  order_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface OrderNotesSectionProps {
  orderId: string;
}

export const OrderNotesSection: React.FC<OrderNotesSectionProps> = ({ orderId }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [orderId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      logError('OrderNotesSection:fetchNotes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newNote.trim() || !user || !profile) return;

    setSubmitting(true);
    try {
      const authorName = profile.full_name || profile.company_name || profile.email;
      
      const { data, error } = await supabase
        .from('order_notes')
        .insert({
          order_id: orderId,
          author_id: user.id,
          author_name: authorName,
          content: newNote.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes((prev) => [...prev, data]);
      setNewNote('');
      
      toast({
        title: 'Notiz hinzugefügt',
        description: 'Die interne Notiz wurde erfolgreich gespeichert.',
      });
    } catch (error) {
      logError('OrderNotesSection:addNote', error);
      toast({
        title: 'Fehler',
        description: 'Notiz konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('order_notes')
        .update({ content: editContent.trim() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? { ...note, content: editContent.trim(), updated_at: new Date().toISOString() }
            : note
        )
      );
      setEditingId(null);
      setEditContent('');

      toast({
        title: 'Notiz aktualisiert',
        description: 'Die Notiz wurde erfolgreich bearbeitet.',
      });
    } catch (error) {
      logError('OrderNotesSection:updateNote', error);
      toast({
        title: 'Fehler',
        description: 'Notiz konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;

    try {
      const { error } = await supabase
        .from('order_notes')
        .delete()
        .eq('id', noteToDelete);

      if (error) throw error;

      setNotes((prev) => prev.filter((note) => note.id !== noteToDelete));
      
      toast({
        title: 'Notiz gelöscht',
        description: 'Die Notiz wurde erfolgreich entfernt.',
      });
    } catch (error) {
      logError('OrderNotesSection:deleteNote', error);
      toast({
        title: 'Fehler',
        description: 'Notiz konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const startEdit = (note: OrderNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  if (loading) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <MessageSquare className="h-5 w-5" />
            Interne Notizen ({notes.length})
          </CardTitle>
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Nur für Admins sichtbar
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notes List */}
          {notes.length > 0 ? (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-background rounded-lg p-3 border shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                          {getInitials(note.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {note.author_name}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(note.created_at)}
                            {note.updated_at !== note.created_at && ' (bearbeitet)'}
                          </span>
                        </div>
                        
                        {editingId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={3}
                              className="text-sm"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEdit}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Abbrechen
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEdit(note.id)}
                                disabled={!editContent.trim()}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Speichern
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                              {note.content}
                            </p>
                            {note.author_id === user?.id && (
                              <div className="flex gap-1 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => startEdit(note)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setNoteToDelete(note.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Noch keine internen Notizen vorhanden.</p>
            </div>
          )}

          {/* New Note Input */}
          <div className="pt-3 border-t space-y-2">
            <Textarea
              placeholder="Neue interne Notiz hinzufügen..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              className="bg-background resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Strg + Enter zum Senden
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newNote.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notiz löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Notiz wird permanent gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
