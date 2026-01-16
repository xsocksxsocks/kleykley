import React, { useState } from 'react';
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
  Upload,
  FileText,
  Loader2,
  Check,
  Trash2,
  Edit,
  Save,
  X,
} from 'lucide-react';
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
}

interface Category {
  id: string;
  name: string;
}

interface BulkProductImporterProps {
  categories: Category[];
  onImportComplete: () => void;
}

export const BulkProductImporter: React.FC<BulkProductImporterProps> = ({
  categories,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setProducts([]);
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

      const extractedProducts: ExtractedProduct[] = data.products.map((p: any, index: number) => ({
        id: `temp-${index}-${Date.now()}`,
        name: p.name || '',
        description: p.description || null,
        price: p.price || null,
        category: p.category || null,
        stock_quantity: p.stock_quantity || null,
        selected: true,
        editing: false,
      }));

      setExtractionProgress(100);
      setExtractionStatus('Fertig!');
      setProducts(extractedProducts);

      toast({
        title: 'Extraktion erfolgreich',
        description: `${extractedProducts.length} Produkte gefunden.`,
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

  const handleToggleSelect = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected })));
  };

  const handleStartEdit = (product: ExtractedProduct) => {
    setEditingProduct({ ...product });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    setProducts((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? { ...editingProduct, editing: false } : p))
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
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < selectedProducts.length; i++) {
        const product = selectedProducts[i];
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / selectedProducts.length) * 100));
        
        // Find category ID if category name matches
        const categoryMatch = categories.find(
          (c) => c.name.toLowerCase() === product.category?.toLowerCase()
        );

        const productData = {
          name: product.name,
          description: product.description,
          price: product.price || 0,
          category_id: categoryMatch?.id || null,
          stock_quantity: product.stock_quantity || 0,
          is_active: true,
        };

        const { error } = await supabase.from('products').insert(productData);

        if (error) {
          console.error('Error inserting product:', error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast({
        title: 'Import abgeschlossen',
        description: `${successCount} Produkte importiert${errorCount > 0 ? `, ${errorCount} Fehler` : ''}.`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });

      if (successCount > 0) {
        setProducts([]);
        setFile(null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Bulk-Import
        </CardTitle>
        <CardDescription>
          Lade eine PDF-Datei hoch um Produkte automatisch mit KI zu extrahieren.
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
                        checked={selectedCount === products.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
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
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={product.selected}
                          onCheckedChange={() => handleToggleSelect(product.id)}
                        />
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
                              <Badge variant="outline">{product.category}</Badge>
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
                  {selectedCount} von {products.length} Produkten werden importiert
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
