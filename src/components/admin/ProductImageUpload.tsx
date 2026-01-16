import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, GripVertical, Loader2 } from 'lucide-react';

interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface ProductImageUploadProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

interface SortableImageProps {
  image: ProductImage;
  onDelete: (id: string) => void;
}

const SortableImage: React.FC<SortableImageProps> = ({ image, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-muted rounded-lg overflow-hidden aspect-square"
    >
      <img
        src={image.image_url}
        alt="Produktbild"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-2 bg-background rounded-full cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => onDelete(image.id)}
          className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
      {image.sort_order === 0 && (
        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
          Hauptbild
        </span>
      )}
    </div>
  );
};

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  images,
  onImagesChange,
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const newImages: ProductImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        const newSortOrder = images.length + newImages.length;

        // Insert to database
        const { data: imageData, error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: urlData.publicUrl,
            sort_order: newSortOrder,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        newImages.push(imageData as ProductImage);
      }

      onImagesChange([...images, ...newImages]);

      toast({
        title: 'Bilder hochgeladen',
        description: `${files.length} Bild(er) erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Fehler',
        description: 'Bilder konnten nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const imageToDelete = images.find((img) => img.id === imageId);
      if (!imageToDelete) return;

      // Extract file path from URL
      const urlParts = imageToDelete.image_url.split('/product-images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('product-images').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      const updatedImages = images.filter((img) => img.id !== imageId);
      onImagesChange(updatedImages);

      toast({
        title: 'Bild gelöscht',
        description: 'Das Bild wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Fehler',
        description: 'Bild konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = images.findIndex((img) => img.id === active.id);
        const newIndex = images.findIndex((img) => img.id === over.id);

        const newImages = arrayMove(images, oldIndex, newIndex).map(
          (img, index) => ({
            ...img,
            sort_order: index,
          })
        );

        onImagesChange(newImages);

        // Update sort orders in database
        try {
          for (const img of newImages) {
            await supabase
              .from('product_images')
              .update({ sort_order: img.sort_order })
              .eq('id', img.id);
          }
        } catch (error) {
          console.error('Error updating sort order:', error);
          toast({
            title: 'Fehler',
            description: 'Reihenfolge konnte nicht gespeichert werden.',
            variant: 'destructive',
          });
        }
      }
    },
    [images, onImagesChange, toast]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Produktbilder</Label>
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <Button variant="outline" size="sm" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lädt...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Bilder hochladen
              </>
            )}
          </Button>
        </div>
      </div>

      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-3">
              {images
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((image) => (
                  <SortableImage
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Noch keine Bilder vorhanden
          </p>
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Ziehen Sie die Bilder, um die Reihenfolge zu ändern. Das erste Bild wird als Hauptbild angezeigt.
        </p>
      )}
    </div>
  );
};
