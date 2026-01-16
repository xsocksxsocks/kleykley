import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  Upload,
  FileText,
  Loader2,
  Check,
  Trash2,
  Edit,
  Save,
  X,
  AlertTriangle,
  Plus,
  Copy,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/types/shop';

interface ExtractedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  stock_quantity: number | null;
  selected: boolean;
  editing: boolean;
  isDuplicate: boolean;
  existingProductId?: string;
  updateExisting?: boolean; // New: flag to update instead of create
}

interface Category {
  id: string;
  name: string;
}

interface ExistingProduct {
  id: string;
  name: string;
  product_number: string | null;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
}

interface ExistingProductDetails {
  id: string;
  name: string;
  product_number: string | null;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  category_name?: string;
}

interface BulkProductImporterProps {
  categories: Category[];
  onImportComplete: () => void;
}

export const BulkProductImporter: React.FC<BulkProductImporterProps> = ({
  categories: initialCategories,
  onImportComplete,
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStatus, setExtractionStatus] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [products, setProducts] = useState<ExtractedProduct[]>([]);
  const [editingProduct, setEditingProduct] = useState<ExtractedProduct | null>(null);
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [newCategoriesToCreate, setNewCategoriesToCreate] = useState<string[]>([]);
  
  // Duplicate handling dialog
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [currentDuplicate, setCurrentDuplicate] = useState<ExtractedProduct | null>(null);
  const [existingProductDetails, setExistingProductDetails] = useState<ExistingProductDetails | null>(null);
  const [loadingExistingProduct, setLoadingExistingProduct] = useState(false);

  // Fetch existing products for duplicate detection
  useEffect(() => {
    const fetchExistingProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, product_number, description, price, stock_quantity, category_id');
      if (data) {
        setExistingProducts(data);
      }
    };
    fetchExistingProducts();
  }, []);

  // Update categories when props change
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setProducts([]);
      setNewCategoriesToCreate([]);
    } else {
      toast({
        title: 'Ungültiges Format',
        description: 'Bitte wähle eine PDF-Datei aus.',
        variant: 'destructive',
      });
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const checkForDuplicates = (productName: string): ExistingProduct | undefined => {
    const normalizedName = productName.toLowerCase().trim();
    return existingProducts.find(
      (p) => p.name.toLowerCase().trim() === normalizedName
    );
  };

  const detectNewCategories = (extractedProducts: any[]): string[] => {
    const newCats: string[] = [];
    extractedProducts.forEach((p) => {
      if (p.category) {
        const categoryName = p.category.trim();
        const exists = categories.some(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (!exists && !newCats.some((nc) => nc.toLowerCase() === categoryName.toLowerCase())) {
          newCats.push(categoryName);
        }
      }
    });
    return newCats;
  };

  const handleExtract = async () => {
    if (!file) return;

    setExtracting(true);
    setExtractionProgress(0);
    setExtractionStatus('Konvertiere PDF...');
    
    try {
      setExtractionProgress(10);
      const base64 = await convertToBase64(file);
      
      setExtractionProgress(20);
      setExtractionStatus('Sende an KI zur Analyse...');

      const { data, error } = await supabase.functions.invoke('extract-products-from-pdf', {
        body: { pdfBase64: base64 },
      });

      setExtractionProgress(80);
      setExtractionStatus('Verarbeite Ergebnisse...');

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Extraktion fehlgeschlagen');
      }

      // Detect new categories
      const newCats = detectNewCategories(data.products);
      setNewCategoriesToCreate(newCats);

      const extractedProducts: ExtractedProduct[] = data.products.map((p: any, index: number) => {
        const duplicate = checkForDuplicates(p.name || '');
        return {
          id: `temp-${index}-${Date.now()}`,
          name: p.name || '',
          description: p.description || null,
          price: p.price || null,
          category: p.category || null,
          stock_quantity: p.stock_quantity || null,
          selected: !duplicate, // Don't auto-select duplicates
          editing: false,
          isDuplicate: !!duplicate,
          existingProductId: duplicate?.id,
        };
      });

      setExtractionProgress(100);
      setExtractionStatus('Fertig!');
      setProducts(extractedProducts);

      const duplicateCount = extractedProducts.filter((p) => p.isDuplicate).length;
      
      toast({
        title: 'Extraktion erfolgreich',
        description: `${extractedProducts.length} Produkte gefunden${duplicateCount > 0 ? ` (${duplicateCount} Duplikate erkannt)` : ''}${newCats.length > 0 ? `, ${newCats.length} neue Kategorien` : ''}.`,
      });
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast({
        title: 'Fehler bei der Extraktion',
        description: error.message || 'Produkte konnten nicht extrahiert werden.',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
      setExtractionProgress(0);
      setExtractionStatus('');
    }
  };

  const handleToggleSelect = async (id: string) => {
    const product = products.find((p) => p.id === id);
    
    // If it's a duplicate and being selected, show the dialog with existing product details
    if (product?.isDuplicate && !product.selected && product.existingProductId) {
      setCurrentDuplicate(product);
      setLoadingExistingProduct(true);
      setDuplicateDialogOpen(true);
      
      // Fetch existing product details for comparison
      const existing = existingProducts.find((p) => p.id === product.existingProductId);
      if (existing) {
        const category = categories.find((c) => c.id === existing.category_id);
        setExistingProductDetails({
          ...existing,
          category_name: category?.name,
        });
      }
      setLoadingExistingProduct(false);
      return;
    }
    
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleDuplicateAction = (action: 'skip' | 'edit' | 'import_anyway' | 'update_existing') => {
    if (!currentDuplicate) return;

    if (action === 'skip') {
      // Keep it deselected
      setProducts((prev) =>
        prev.map((p) => (p.id === currentDuplicate.id ? { ...p, selected: false, updateExisting: false } : p))
      );
    } else if (action === 'edit') {
      // Select it and open edit mode
      setProducts((prev) =>
        prev.map((p) => (p.id === currentDuplicate.id ? { ...p, selected: true, updateExisting: false } : p))
      );
      handleStartEdit(currentDuplicate);
    } else if (action === 'import_anyway') {
      // Just select it for import as new product
      setProducts((prev) =>
        prev.map((p) => (p.id === currentDuplicate.id ? { ...p, selected: true, updateExisting: false } : p))
      );
    } else if (action === 'update_existing') {
      // Select it and mark for update
      setProducts((prev) =>
        prev.map((p) => (p.id === currentDuplicate.id ? { ...p, selected: true, updateExisting: true } : p))
      );
    }

    setDuplicateDialogOpen(false);
    setCurrentDuplicate(null);
    setExistingProductDetails(null);
  };

  const handleSelectAll = (selected: boolean) => {
    setProducts((prev) => prev.map((p) => ({ 
      ...p, 
      selected: selected && !p.isDuplicate // Don't auto-select duplicates
    })));
  };

  const handleStartEdit = (product: ExtractedProduct) => {
    setEditingProduct({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    
    // Check if name was changed and if it's still a duplicate
    const duplicate = checkForDuplicates(editingProduct.name);
    const isDuplicate = duplicate && duplicate.id !== editingProduct.existingProductId;
    
    setProducts((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? { 
        ...editingProduct, 
        editing: false,
        isDuplicate: !!isDuplicate,
        existingProductId: isDuplicate ? duplicate.id : undefined,
      } : p))
    );
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleImport = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      toast({
        title: 'Keine Produkte ausgewählt',
        description: 'Bitte wähle mindestens ein Produkt zum Importieren aus.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setImportProgress(0);
    
    try {
      // Step 1: Create new categories first
      const createdCategories: { name: string; id: string }[] = [];
      
      for (const catName of newCategoriesToCreate) {
        // Check if any selected product uses this category
        const usesCategory = selectedProducts.some(
          (p) => p.category?.toLowerCase() === catName.toLowerCase()
        );
        
        if (usesCategory) {
          // Check if category already exists (might have been created in previous import)
          const { data: existingCat } = await supabase
            .from('categories')
            .select('id, name')
            .ilike('name', catName)
            .maybeSingle();

          if (existingCat) {
            createdCategories.push({ name: catName, id: existingCat.id });
          } else {
            // Create new category
            const { data: newCat, error: catError } = await supabase
              .from('categories')
              .insert({ name: catName })
              .select('id, name')
              .single();

            if (catError) {
              console.error('Error creating category:', catError);
            } else if (newCat) {
              createdCategories.push({ name: catName, id: newCat.id });
            }
          }
        }
      }

      // Update local categories with newly created ones
      if (createdCategories.length > 0) {
        setCategories((prev) => [...prev, ...createdCategories]);
      }

      // Combine existing and new categories for lookup
      const allCategories = [...categories, ...createdCategories];

      // Step 2: Import/Update products
      let successCount = 0;
      let updateCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / selectedProducts.length) * 100));
        
        // Find category ID - check both existing and newly created categories
        let categoryId: string | null = null;
        if (product.category) {
          const categoryMatch = allCategories.find(
            (c) => c.name.toLowerCase() === product.category?.toLowerCase()
          );
          categoryId = categoryMatch?.id || null;
        }

        const productData = {
          name: product.name,
          description: product.description,
          price: product.price || 0,
          category_id: categoryId,
          stock_quantity: product.stock_quantity || 0,
          is_active: true,
        };

        // Check if we should update existing product
        if (product.updateExisting && product.existingProductId) {
          const { error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', product.existingProductId);

          if (error) {
            console.error('Error updating product:', error);
            errorCount++;
          } else {
            updateCount++;
          }
        } else {
          const { error } = await supabase.from('products').insert(productData);

          if (error) {
            console.error('Error inserting product:', error);
            errorCount++;
          } else {
            successCount++;
          }
        }
      }

      const parts = [];
      if (successCount > 0) parts.push(`${successCount} neu importiert`);
      if (updateCount > 0) parts.push(`${updateCount} aktualisiert`);
      if (createdCategories.length > 0) parts.push(`${createdCategories.length} Kategorien erstellt`);
      if (errorCount > 0) parts.push(`${errorCount} Fehler`);

      toast({
        title: 'Import abgeschlossen',
        description: parts.join(', ') + '.',
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      if (successCount > 0 || updateCount > 0) {
        setProducts([]);
        setFile(null);
        setNewCategoriesToCreate([]);
        onImportComplete();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: 'Fehler beim Import',
        description: error.message || 'Produkte konnten nicht importiert werden.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const selectedCount = products.filter((p) => p.selected).length;
  const duplicateCount = products.filter((p) => p.isDuplicate).length;
  const selectedDuplicateCount = products.filter((p) => p.selected && p.isDuplicate).length;
  const updateCount = products.filter((p) => p.selected && p.updateExisting).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Bulk-Import
          </CardTitle>
          <CardDescription>
            Lade eine PDF-Datei hoch um Produkte automatisch mit KI zu extrahieren.
            Kategorien werden automatisch erstellt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="pdf-file">PDF-Datei auswählen</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              <Button
                onClick={handleExtract}
                disabled={!file || extracting}
                className="min-w-[140px]"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analysiere...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Extrahieren
                  </>
                )}
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}

            {/* Extraction Progress */}
            {extracting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{extractionStatus}</span>
                  <span className="font-medium">{extractionProgress}%</span>
                </div>
                <Progress value={extractionProgress} className="h-2" />
              </div>
            )}
          </div>

          {/* New Categories Info */}
          {newCategoriesToCreate.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-300">
                    Neue Kategorien werden erstellt
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Folgende Kategorien existieren noch nicht und werden beim Import automatisch erstellt:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newCategoriesToCreate.map((cat) => (
                      <Badge key={cat} variant="secondary" className="bg-blue-100 dark:bg-blue-900">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateCount > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 dark:text-amber-300">
                    {duplicateCount} Duplikat{duplicateCount !== 1 ? 'e' : ''} erkannt
                  </h4>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    Diese Produkte existieren bereits. Du kannst sie bearbeiten, 
                    trotzdem importieren oder überspringen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Products */}
          {products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">
                    Extrahierte Produkte ({products.length})
                  </h3>
                  <Badge variant={selectedCount > 0 ? 'default' : 'secondary'}>
                    {selectedCount} ausgewählt
                  </Badge>
                  {selectedDuplicateCount > 0 && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      {selectedDuplicateCount} Duplikat{selectedDuplicateCount !== 1 ? 'e' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(true)}
                  >
                    Alle auswählen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll(false)}
                  >
                    Auswahl aufheben
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedCount === products.length && products.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Menge</TableHead>
                      <TableHead className="text-right">Preis</TableHead>
                      <TableHead className="w-[100px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow 
                        key={product.id}
                        className={product.isDuplicate ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={product.selected}
                            onCheckedChange={() => handleToggleSelect(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {product.isDuplicate ? (
                            product.updateExisting ? (
                              <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Update
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                                <Copy className="h-3 w-3 mr-1" />
                                Duplikat
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Neu
                            </Badge>
                          )}
                        </TableCell>
                        {editingProduct?.id === product.id ? (
                          <>
                            <TableCell>
                              <Input
                                value={editingProduct.name}
                                onChange={(e) =>
                                  setEditingProduct({ ...editingProduct, name: e.target.value })
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editingProduct.description || ''}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    description: e.target.value || null,
                                  })
                                }
                                className="h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={editingProduct.category || 'none'}
                                onValueChange={(value) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    category: value === 'none' ? null : value,
                                  })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Keine</SelectItem>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </SelectItem>
                                  ))}
                                  {newCategoriesToCreate.map((cat) => (
                                    <SelectItem key={`new-${cat}`} value={cat}>
                                      {cat} (neu)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={editingProduct.stock_quantity || ''}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    stock_quantity: e.target.value ? parseInt(e.target.value) : null,
                                  })
                                }
                                className="h-8 w-20 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingProduct.price || ''}
                                onChange={(e) =>
                                  setEditingProduct({
                                    ...editingProduct,
                                    price: e.target.value ? parseFloat(e.target.value) : null,
                                  })
                                }
                                className="h-8 text-right"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleSaveEdit}
                                  className="h-7 w-7"
                                >
                                  <Save className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleCancelEdit}
                                  className="h-7 w-7"
                                >
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-muted-foreground">
                              {product.description || '-'}
                            </TableCell>
                            <TableCell>
                              {product.category ? (
                                <Badge 
                                  variant="outline"
                                  className={
                                    newCategoriesToCreate.some(
                                      (nc) => nc.toLowerCase() === product.category?.toLowerCase()
                                    )
                                      ? 'border-blue-500 text-blue-600'
                                      : ''
                                  }
                                >
                                  {product.category}
                                  {newCategoriesToCreate.some(
                                    (nc) => nc.toLowerCase() === product.category?.toLowerCase()
                                  ) && (
                                    <Plus className="h-3 w-3 ml-1" />
                                  )}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.stock_quantity !== null ? product.stock_quantity : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.price !== null ? formatCurrency(product.price) : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStartEdit(product)}
                                  className="h-7 w-7"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="h-7 w-7"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Import Progress */}
              {importing && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Importiere Produkte...</span>
                    <span className="font-medium">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}

              {/* Import Button */}
              {!importing && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {selectedCount} von {products.length} Produkten
                    {updateCount > 0 && (
                      <span className="text-blue-600 ml-1">
                        ({updateCount} werden aktualisiert)
                      </span>
                    )}
                    {selectedDuplicateCount > 0 && selectedDuplicateCount !== updateCount && (
                      <span className="text-amber-600 ml-1">
                        ({selectedDuplicateCount - updateCount} Duplikat{(selectedDuplicateCount - updateCount) !== 1 ? 'e' : ''} neu)
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={selectedCount === 0 || importing}
                    className="min-w-[180px]"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {selectedCount} Produkte importieren
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {products.length === 0 && !extracting && (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Lade eine PDF-Datei hoch und klicke auf "Extrahieren"</p>
              <p className="text-sm mt-2">
                Die KI erkennt automatisch Produkte, Preise, Mengen und Beschreibungen.
              </p>
              <p className="text-sm mt-1 text-blue-600">
                Kategorien werden automatisch erstellt, wenn sie noch nicht existieren.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Handling Dialog with Comparison */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDuplicateDialogOpen(false);
          setCurrentDuplicate(null);
          setExistingProductDetails(null);
        }
      }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Duplikat erkannt
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Das Produkt <strong>"{currentDuplicate?.name}"</strong> existiert bereits.
                </p>
                
                {/* Comparison View */}
                {loadingExistingProduct ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : existingProductDetails && currentDuplicate && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Existing Product */}
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Bestehendes Produkt
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium text-foreground">{existingProductDetails.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Artikelnr.:</span>
                          <p className="font-medium text-foreground">{existingProductDetails.product_number || '-'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Preis:</span>
                          <p className="font-medium text-foreground">{formatCurrency(existingProductDetails.price)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bestand:</span>
                          <p className="font-medium text-foreground">{existingProductDetails.stock_quantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kategorie:</span>
                          <p className="font-medium text-foreground">{existingProductDetails.category_name || '-'}</p>
                        </div>
                        {existingProductDetails.description && (
                          <div>
                            <span className="text-muted-foreground">Beschreibung:</span>
                            <p className="font-medium text-foreground line-clamp-2">{existingProductDetails.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
                      <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>

                    {/* New Product from PDF */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Aus PDF extrahiert
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">Name:</span>
                          <p className="font-medium text-foreground">{currentDuplicate.name}</p>
                        </div>
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">Preis:</span>
                          <p className={`font-medium ${currentDuplicate.price !== existingProductDetails.price ? 'text-amber-600' : 'text-foreground'}`}>
                            {currentDuplicate.price !== null ? formatCurrency(currentDuplicate.price) : '-'}
                            {currentDuplicate.price !== null && currentDuplicate.price !== existingProductDetails.price && (
                              <span className="text-xs ml-1">
                                ({currentDuplicate.price > existingProductDetails.price ? '+' : ''}{formatCurrency(currentDuplicate.price - existingProductDetails.price)})
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">Bestand:</span>
                          <p className={`font-medium ${currentDuplicate.stock_quantity !== existingProductDetails.stock_quantity ? 'text-amber-600' : 'text-foreground'}`}>
                            {currentDuplicate.stock_quantity ?? '-'}
                            {currentDuplicate.stock_quantity !== null && currentDuplicate.stock_quantity !== existingProductDetails.stock_quantity && (
                              <span className="text-xs ml-1">
                                (war: {existingProductDetails.stock_quantity})
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">Kategorie:</span>
                          <p className="font-medium text-foreground">{currentDuplicate.category || '-'}</p>
                        </div>
                        {currentDuplicate.description && (
                          <div>
                            <span className="text-blue-600 dark:text-blue-400">Beschreibung:</span>
                            <p className="font-medium text-foreground line-clamp-2">{currentDuplicate.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Separator />
                <p className="text-sm">Was möchtest du tun?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <AlertDialogCancel onClick={() => handleDuplicateAction('skip')}>
              Überspringen
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={() => handleDuplicateAction('edit')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <Button 
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() => handleDuplicateAction('update_existing')}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Bestehendes aktualisieren
            </Button>
            <AlertDialogAction onClick={() => handleDuplicateAction('import_anyway')}>
              <Plus className="h-4 w-4 mr-2" />
              Neu anlegen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
