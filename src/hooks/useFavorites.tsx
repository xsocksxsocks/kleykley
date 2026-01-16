import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorLogger';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Favorite {
  id: string;
  item_type: 'product' | 'vehicle';
  product_id: string | null;
  vehicle_id: string | null;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data || []).map(item => ({
        ...item,
        item_type: item.item_type as 'product' | 'vehicle',
      })));
    } catch (error) {
      logError('useFavorites:fetchFavorites', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (itemType: 'product' | 'vehicle', itemId: string) => {
    if (!user) return false;

    try {
      const insertData: any = {
        user_id: user.id,
        item_type: itemType,
      };

      if (itemType === 'product') {
        insertData.product_id = itemId;
      } else {
        insertData.vehicle_id = itemId;
      }

      const { error } = await supabase
        .from('favorites')
        .insert(insertData);

      if (error) throw error;
      
      await fetchFavorites();
      toast.success('Zu Favoriten hinzugefügt');
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info('Bereits in Favoriten');
      } else {
        logError('useFavorites:addFavorite', error);
        toast.error('Fehler beim Hinzufügen');
      }
      return false;
    }
  };

  const removeFavorite = async (itemType: 'product' | 'vehicle', itemId: string) => {
    if (!user) return false;

    try {
      let query = supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id);

      if (itemType === 'product') {
        query = query.eq('product_id', itemId);
      } else {
        query = query.eq('vehicle_id', itemId);
      }

      const { error } = await query;
      if (error) throw error;
      
      await fetchFavorites();
      toast.success('Aus Favoriten entfernt');
      return true;
    } catch (error) {
      logError('useFavorites:removeFavorite', error);
      toast.error('Fehler beim Entfernen');
      return false;
    }
  };

  const isFavorite = (itemType: 'product' | 'vehicle', itemId: string) => {
    return favorites.some(fav => 
      itemType === 'product' 
        ? fav.product_id === itemId 
        : fav.vehicle_id === itemId
    );
  };

  const toggleFavorite = async (itemType: 'product' | 'vehicle', itemId: string) => {
    if (isFavorite(itemType, itemId)) {
      return removeFavorite(itemType, itemId);
    } else {
      return addFavorite(itemType, itemId);
    }
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
}
