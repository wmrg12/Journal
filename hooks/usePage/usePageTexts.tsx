// hooks/usePageText.ts
import { useState, useCallback, useRef } from 'react';
import { Animated, Alert } from 'react-native';
import { textColors } from '@/constants/colors';
import { TextFont, textFonts } from '@/constants/fonts';
import {
  createPageText,
  listPageTexts,
  updatePageText,
  deletePageText,
} from '@/src/db/dao';
import { PageText } from '@/types';

export const usePageText = (currentPageId: string | null) => {
  const [pageTexts, setPageTexts] = useState<PageText[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [lockedTextIds, setLockedTextIds] = useState<Record<string, boolean>>({});
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState<(typeof textColors)[number]>(
    textColors[0],
  );
  const [selectedFont, setSelectedFont] = useState<TextFont>(textFonts[0]);

  const pansRef = useRef(new Map<string, Animated.ValueXY>());

  const getPanFor = useCallback((t: PageText) => {
    let pan = pansRef.current.get(t.id);
    if (!pan) {
      pan = new Animated.ValueXY({ x: t.position_x, y: t.position_y });
      pansRef.current.set(t.id, pan);
    }
    return pan;
  }, []);

  const mergeById = useCallback((prev: PageText[], latest: PageText[]) => {
    const prevMap = new Map(prev.map((t) => [t.id, t]));
    const merged: PageText[] = [];
    for (const t of latest) {
      const old = prevMap.get(t.id);
      merged.push(old ? { ...old, ...t } : t);
      prevMap.delete(t.id);
    }
    return merged;
  }, []);

  const commitTextPosition = useCallback((id: string, x: number, y: number) => {
    setPageTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t)),
    );
  }, []);

  const handleToggleLock = useCallback(
    async (id: string) => {
      setLockedTextIds((prev) => {
        const newLocked = !prev[id];
        if (currentPageId) {
          updatePageText(id, { is_locked: newLocked ? 1 : 0 }).catch((e) => {
            console.error('Error updating lock state:', e);
            setLockedTextIds((current) => ({
              ...current,
              [id]: !newLocked,
            }));
          });
        }
        return {
          ...prev,
          [id]: newLocked,
        };
      });
    },
    [currentPageId],
  );

  const handleSelectText = useCallback((id: string) => {
    setSelectedTextId(id);
  }, []);

  const handleEditTextRequest = useCallback((t: PageText) => {
    setEditingTextId(t.id);
    setSelectedTextId(t.id);
    setTextInput(t.content);
    setSelectedFont(t.font_family as TextFont);
    setSelectedTextColor(t.color as (typeof textColors)[number]);
  }, []);

  const handleDeleteText = useCallback(
    async (textId: string) => {
      if (!currentPageId) return;

      Alert.alert('Eliminar texto', '¿Estás seguro?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setPageTexts((prev) => prev.filter((t) => t.id !== textId));
            pansRef.current.delete(textId);
            setLockedTextIds((prev) => {
              const copy = { ...prev };
              delete copy[textId];
              return copy;
            });
            setSelectedTextId((prev) => (prev === textId ? null : prev));

            try {
              await deletePageText(textId);
              const latest = await listPageTexts(currentPageId);
              setPageTexts((prev) => mergeById(prev, latest));
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo eliminar el texto.');
              const latest = await listPageTexts(currentPageId);
              setPageTexts(latest);
            }
          },
        },
      ]);
    },
    [currentPageId, mergeById],
  );

  const handleDuplicateText = useCallback(
    async (text: PageText) => {
      if (!currentPageId) return;

      try {
        const offsetX = 20;
        const offsetY = 20;

        const { id: newId } = await createPageText(
          currentPageId,
          text.content,
          text.font_family,
          text.color,
          text.position_x + offsetX,
          text.position_y + offsetY,
          text.font_size || 16,
          text.rotation ?? 0,
          text.is_locked ?? 0,
        );

        const latest = await listPageTexts(currentPageId);
        setPageTexts(latest);
        setSelectedTextId(newId);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo duplicar el texto.');
      }
    },
    [currentPageId],
  );

  const handleConfirmText = useCallback(
    async (onSuccess?: () => void) => {
      const trimmed = textInput.trim();
      if (!trimmed) {
        Alert.alert('Error', 'Escribe algo primero');
        return;
      }
      if (!currentPageId) {
        Alert.alert('Error', 'No se pudo identificar la página');
        return;
      }

      try {
        if (!editingTextId) {
          const posX = 100;
          const posY = 150;
          await createPageText(
            currentPageId,
            trimmed,
            selectedFont,
            selectedTextColor,
            posX,
            posY,
            16,
          );
        } else {
          await updatePageText(editingTextId, {
            content: trimmed,
            font_family: selectedFont,
            color: selectedTextColor,
          });
        }

        const latest = await listPageTexts(currentPageId);
        setPageTexts((prev) => mergeById(prev, latest));
        setTextInput('');
        setEditingTextId(null);
        onSuccess?.();
      } catch (e) {
        console.error(e);
        Alert.alert(
          'Error',
          editingTextId ? 'No se pudo actualizar el texto.' : 'No se pudo añadir el texto.',
        );
      }
    },
    [textInput, selectedTextColor, selectedFont, currentPageId, mergeById, editingTextId],
  );

  return {
    pageTexts,
    setPageTexts,
    selectedTextId,
    setSelectedTextId,
    lockedTextIds,
    setLockedTextIds,
    editingTextId,
    setEditingTextId,
    textInput,
    setTextInput,
    selectedTextColor,
    setSelectedTextColor,
    selectedFont,
    setSelectedFont,
    getPanFor,
    mergeById,
    commitTextPosition,
    handleToggleLock,
    handleSelectText,
    handleEditTextRequest,
    handleDeleteText,
    handleDuplicateText,
    handleConfirmText,
  };
};