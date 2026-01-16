import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, FolderOpen, Folder, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  sort_order: number;
  parent_id: string | null;
}

interface CategoryManagementProps {
  categories: Category[];
  onCategoriesChange: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  onCategoriesChange,
}) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    sort_order: '0',
  });

  // Get parent categories (those without parent_id)
  const parentCategories = useMemo(() => {
    return categories.filter(c => c.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  // Get subcategories grouped by parent
  const getSubcategories = (parentId: string) => {
    return categories.filter(c => c.parent_id === parentId).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Count products per category
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchProductCounts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id');
      
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach(p => {
          if (p.category_id) {
            counts[p.category_id] = (counts[p.category_id] || 0) + 1;
          }
        });
        setProductCounts(counts);
      }
    };
    fetchProductCounts();
  }, [categories]);

  const resetForm = () => {
    setFormData({ name: '', parent_id: '', sort_order: '0' });
    setEditingCategory(null);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id || '',
      sort_order: category.sort_order.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Namen ein.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const categoryData = {
        name: formData.name.trim(),
        parent_id: formData.parent_id || null,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast({ title: 'Kategorie aktualisiert' });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) throw error;
        toast({ title: 'Kategorie erstellt' });
      }

      setDialogOpen(false);
      resetForm();
      onCategoriesChange();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // Check if it's a parent category with subcategories
      const subcats = getSubcategories(categoryToDelete.id);
      if (subcats.length > 0) {
        // Move subcategories to "Sonstiges" or make them orphans
        const { error: updateError } = await supabase
          .from('categories')
          .update({ parent_id: null })
          .eq('parent_id', categoryToDelete.id);

        if (updateError) throw updateError;
      }

      // Clear category_id from products
      const { error: productError } = await supabase
        .from('products')
        .update({ category_id: null })
        .eq('category_id', categoryToDelete.id);

      if (productError) throw productError;

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast({ title: 'Kategorie gelöscht' });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      onCategoriesChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const getParentProductCount = (parentId: string): number => {
    const subcats = getSubcategories(parentId);
    return subcats.reduce((sum, sub) => sum + (productCounts[sub.id] || 0), 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Kategorien verwalten
        </CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Kategorie hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name *</Label>
                <Input
                  id="cat-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Kategoriename"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-parent">Ober-Kategorie</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Keine (Ober-Kategorie)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine (Ober-Kategorie)</SelectItem>
                    {parentCategories
                      .filter(p => p.id !== editingCategory?.id)
                      .map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leer lassen für eine Ober-Kategorie, oder wählen Sie eine bestehende Ober-Kategorie.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-sort">Sortierung</Label>
                <Input
                  id="cat-sort"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Kleinere Zahlen werden zuerst angezeigt.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>
                {editingCategory ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Accordion type="multiple" className="w-full">
            {parentCategories.map((parent) => {
              const subcats = getSubcategories(parent.id);
              const totalProducts = getParentProductCount(parent.id);
              
              return (
                <AccordionItem key={parent.id} value={parent.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Folder className="h-4 w-4 text-primary" />
                      <span className="font-medium">{parent.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {subcats.length} Unterkategorien
                      </Badge>
                      <Badge variant="outline" className="ml-1">
                        {totalProducts} Produkte
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-6 space-y-2">
                      {/* Parent category actions */}
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(parent)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setCategoryToDelete(parent);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Löschen
                        </Button>
                      </div>
                      
                      {/* Subcategories */}
                      {subcats.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          Keine Unterkategorien
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead className="w-24 text-center">Produkte</TableHead>
                              <TableHead className="w-32 text-right">Aktionen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subcats.map((subcat) => (
                              <TableRow key={subcat.id}>
                                <TableCell className="flex items-center gap-2">
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  {subcat.name}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">
                                    {productCounts[subcat.id] || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(subcat)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setCategoryToDelete(subcat);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Orphan categories (no parent, not a parent themselves) */}
          {categories.filter(c => c.parent_id === null && getSubcategories(c.id).length === 0 && !parentCategories.some(p => p.id === c.id)).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Nicht zugeordnete Kategorien</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Diese Kategorien sind Ober-Kategorien ohne Unterkategorien.
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 pt-4 border-t flex gap-4 text-sm text-muted-foreground">
          <span>{parentCategories.length} Ober-Kategorien</span>
          <span>{categories.length - parentCategories.length} Unterkategorien</span>
          <span>{categories.length} Gesamt</span>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete && getSubcategories(categoryToDelete.id).length > 0 ? (
                <>
                  Diese Ober-Kategorie hat {getSubcategories(categoryToDelete.id).length} Unterkategorien.
                  Die Unterkategorien werden zu eigenständigen Kategorien.
                </>
              ) : (
                <>
                  Möchten Sie die Kategorie "{categoryToDelete?.name}" wirklich löschen?
                  Produkte in dieser Kategorie werden keiner Kategorie mehr zugeordnet.
                </>
              )}
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
    </Card>
  );
};

export default CategoryManagement;
