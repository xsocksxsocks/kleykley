import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  itemType: 'product' | 'vehicle';
  itemId: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  itemType,
  itemId,
  size = 'icon',
  className,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [loading, setLoading] = React.useState(false);
  
  const isFav = isFavorite(itemType, itemId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await toggleFavorite(itemType, itemId);
    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "rounded-full hover:bg-accent/20",
        isFav && "text-red-500 hover:text-red-500",
        !isFav && "hover:text-red-400",
        className
      )}
      title={isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
    >
      <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
    </Button>
  );
};
