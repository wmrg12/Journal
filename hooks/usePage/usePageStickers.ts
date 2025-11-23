import {
  PageSticker,
  createPageSticker,
  deletePageSticker,
  duplicatePageSticker,
  listPageStickers,
  toggleStickerLock,
  updatePageSticker,
} from '@/src/db/dao';
import { useCallback, useEffect, useState } from 'react';

export function usePageStickers(pageId: string | null) {
  const [stickers, setStickers] = useState<PageSticker[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Cargar stickers de la página
  const loadStickers = useCallback(async () => {
    if (!pageId) {
      setStickers([]);
      return;
    }

    setLoading(true);
    try {
      const data = await listPageStickers(pageId);
      setStickers(data);
    } catch (error) {
      console.error('Error loading stickers:', error);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  // Cargar stickers cuando cambia la página
  useEffect(() => {
    if (pageId) {
      loadStickers();
    }
  }, [pageId, loadStickers]);

  // Agregar un nuevo sticker
  const addSticker = useCallback(
    async (
      stickerId: string, // ID del sticker (ej: 'sticker1')
      stickerCategory: string,
      positionX: number,
      positionY: number,
      width?: number,
      height?: number,
    ) => {
      if (!pageId) return null;

      try {
        // Guardamos el ID del sticker en lugar de una URL
        const result = await createPageSticker(
          pageId,
          stickerId, // Guardamos el ID como "URL"
          stickerCategory,
          Number(positionX) || 0,
          Number(positionY) || 0,
          Number(width) || 100,
          Number(height) || 100,
        );
        await loadStickers();
        return result.id;
      } catch (error) {
        console.error('Error adding sticker:', error);
        return null;
      }
    },
    [pageId, loadStickers],
  );

  // Actualizar un sticker
  const updateSticker = useCallback(
    async (
      stickerId: string,
      updates: {
        position_x?: number;
        position_y?: number;
        width?: number;
        height?: number;
        rotation?: number;
        is_locked?: number;
      },
    ) => {
      try {
        // Ensure numeric values are stored
        const safeUpdates: any = {};
        if (updates.position_x !== undefined) safeUpdates.position_x = Number(updates.position_x);
        if (updates.position_y !== undefined) safeUpdates.position_y = Number(updates.position_y);
        if (updates.width !== undefined) safeUpdates.width = Number(updates.width);
        if (updates.height !== undefined) safeUpdates.height = Number(updates.height);
        if (updates.rotation !== undefined) safeUpdates.rotation = Number(updates.rotation);
        if (updates.is_locked !== undefined) safeUpdates.is_locked = Number(updates.is_locked);

        await updatePageSticker(stickerId, safeUpdates);
        await loadStickers();
      } catch (error) {
        console.error('Error updating sticker:', error);
      }
    },
    [loadStickers],
  );

  // Duplicar un sticker
  const duplicateSticker = useCallback(
    async (stickerId: string) => {
      try {
        const result = await duplicatePageSticker(stickerId);
        if (result) {
          await loadStickers();
          setSelectedStickerId(result.id);
          return result.id;
        }
        return null;
      } catch (error) {
        console.error('Error duplicating sticker:', error);
        return null;
      }
    },
    [loadStickers],
  );

  // Eliminar un sticker
  const removeSticker = useCallback(
    async (stickerId: string) => {
      try {
        await deletePageSticker(stickerId);
        if (selectedStickerId === stickerId) {
          setSelectedStickerId(null);
        }
        await loadStickers();
      } catch (error) {
        console.error('Error removing sticker:', error);
      }
    },
    [loadStickers, selectedStickerId],
  );

  // Alternar bloqueo de sticker
  const toggleLock = useCallback(
    async (stickerId: string, locked: boolean) => {
      try {
        await toggleStickerLock(stickerId, locked);
        await loadStickers();
      } catch (error) {
        console.error('Error toggling sticker lock:', error);
      }
    },
    [loadStickers],
  );

  // Obtener sticker seleccionado
  const selectedSticker = stickers.find((s) => s.id === selectedStickerId) || null;

  return {
    stickers,
    loading,
    selectedStickerId,
    selectedSticker,
    setSelectedStickerId,
    addSticker,
    updateSticker,
    duplicateSticker,
    removeSticker,
    toggleLock,
    refresh: loadStickers,
  };
}