import { useState, useEffect, useCallback } from 'react';

interface RecentlyViewedItem {
  id: string;
  type: 'product' | 'vehicle';
  viewedAt: number;
}

const STORAGE_KEY = 'recently_viewed_items';
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const addItem = useCallback((id: string, type: 'product' | 'vehicle') => {
    setItems(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => !(item.id === id && item.type === type));
      
      // Add to beginning
      const newItems = [
        { id, type, viewedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_ITEMS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  const getProductIds = useCallback(() => {
    return items.filter(item => item.type === 'product').map(item => item.id);
  }, [items]);

  const getVehicleIds = useCallback(() => {
    return items.filter(item => item.type === 'vehicle').map(item => item.id);
  }, [items]);

  return {
    items,
    addItem,
    clearHistory,
    getProductIds,
    getVehicleIds,
  };
}
