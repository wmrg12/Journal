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

// Agregar parámetros de canvas
export const usePageText = (
  currentPageId: string | null,
  canvasWidth: number = 0,
  canvasHeight: number = 0
) => {
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

  const estimateTextDimensions = useCallback((text: PageText) => {
    const fontSize = text.font_size ?? 16;
    const charWidth = fontSize * 0.6; 
    const lineHeight = fontSize * 1.5;
    const maxCharsPerLine = 30;
    const contentLength = text.content.length;
    const lines = Math.ceil(contentLength / maxCharsPerLine);
    
    const width = Math.min(contentLength * charWidth, maxCharsPerLine * charWidth);
    const height = lines * lineHeight;
    
    return { width, height };
  }, []);

  const clampToCanvas = useCallback(
    (x: number, y: number, textWidth: number, textHeight: number) => {
      let clampedX = x;
      let clampedY = y;

      if (canvasWidth > 0) {
        clampedX = Math.max(0, Math.min(x, canvasWidth - textWidth));
      }

      if (canvasHeight > 0) {
        clampedY = Math.max(0, Math.min(y, canvasHeight - textHeight));
      }

      return { x: clampedX, y: clampedY };
    },
    [canvasWidth, canvasHeight]
  );

  const commitTextPosition = useCallback(async (id: string, x: number, y: number) => {
    setPageTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t)),
    );
    
    try {
      await updatePageText(id, { position_x: x, position_y: y });
    } catch (e) {
      console.error('Error saving text position:', e);
    }
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

  // Duplicación con validación de límites
  const handleDuplicateText = useCallback(
    async (text: PageText) => {
      if (!currentPageId) return;

      try {
        const offsetX = 20;
        const offsetY = 20;

        const currentText = pageTexts.find(t => t.id === text.id) || text;

        // Estimar dimensiones del texto
        const { width: textWidth, height: textHeight } = estimateTextDimensions(currentText);

        // Calcular posición candidata
        let newX = currentText.position_x + offsetX;
        let newY = currentText.position_y + offsetY;

        if (canvasWidth > 0 && canvasHeight > 0) {
          if (
            newX + textWidth > canvasWidth ||
            newY + textHeight > canvasHeight
          ) {
            const alternatives = [
              { x: currentText.position_x - offsetX, y: currentText.position_y + offsetY }, // Izquierda-abajo
              { x: currentText.position_x + offsetX, y: currentText.position_y - offsetY }, // Derecha-arriba
              { x: currentText.position_x - offsetX, y: currentText.position_y - offsetY }, // Izquierda-arriba
              { x: currentText.position_x, y: currentText.position_y + offsetY },           // Centro-abajo
              { x: currentText.position_x + offsetX, y: currentText.position_y },           // Derecha-centro
              { x: currentText.position_x - offsetX, y: currentText.position_y },           // Izquierda-centro
              { x: currentText.position_x, y: currentText.position_y - offsetY },           // Centro-arriba
            ];

            // Buscar la primera posición válida
            let foundValid = false;
            for (const alt of alternatives) {
              if (
                alt.x >= 0 &&
                alt.y >= 0 &&
                alt.x + textWidth <= canvasWidth &&
                alt.y + textHeight <= canvasHeight
              ) {
                newX = alt.x;
                newY = alt.y;
                foundValid = true;
                console.log(' Encontró posición alternativa válida:', { x: newX, y: newY });
                break;
              }
            }

            if (!foundValid) {
              newX = Math.max(0, (canvasWidth - textWidth) / 2);
              newY = Math.max(0, (canvasHeight - textHeight) / 2);
              console.log(' Ninguna alternativa válida, centrando:', { x: newX, y: newY });
            }
          }

          // Aplicar límites 
          const clamped = clampToCanvas(newX, newY, textWidth, textHeight);
          newX = clamped.x;
          newY = clamped.y;
        }

        const { id: newId } = await createPageText(
          currentPageId,
          currentText.content,
          currentText.font_family,
          currentText.color,
          newX,  
          newY,  
          currentText.font_size || 16, 
          currentText.rotation ?? 0,    
          currentText.is_locked ?? 0,
        );

        const latest = await listPageTexts(currentPageId);
        setPageTexts(latest);
        setSelectedTextId(newId);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo duplicar el texto.');
      }
    },
    [currentPageId, pageTexts, canvasWidth, canvasHeight, estimateTextDimensions, clampToCanvas],
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
          // Crear nuevo texto
          let posX = 100;
          let posY = 150;
          if (canvasWidth > 0 && canvasHeight > 0) {
            const fontSize = 16;
            const estimatedWidth = trimmed.length * fontSize * 0.6;
            const estimatedHeight = fontSize * 1.5;

            posX = Math.max(0, (canvasWidth - estimatedWidth) / 2);
            posY = Math.max(0, (canvasHeight - estimatedHeight) / 2);

            // Aplicar límites
            const clamped = clampToCanvas(posX, posY, estimatedWidth, estimatedHeight);
            posX = clamped.x;
            posY = clamped.y;
          }

          await createPageText(
            currentPageId,
            trimmed,
            selectedFont,
            selectedTextColor,
            posX,
            posY,
            16,
          );
          
          const latest = await listPageTexts(currentPageId);
          setPageTexts((prev) => mergeById(prev, latest));
        } else {
          // Editar texto existente
          const currentText = pageTexts.find(t => t.id === editingTextId);
          await updatePageText(editingTextId, {
            content: trimmed,
            font_family: selectedFont,
            color: selectedTextColor,
            position_x: currentText?.position_x, 
            position_y: currentText?.position_y,
          });
          
          // Actualizar solo localmente sin recargar desde DB
          setPageTexts(prev => prev.map(t => 
            t.id === editingTextId 
              ? { ...t, content: trimmed, font_family: selectedFont, color: selectedTextColor }
              : t
          ));
        }

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
    [
      textInput, 
      selectedTextColor, 
      selectedFont, 
      currentPageId, 
      mergeById, 
      editingTextId, 
      pageTexts,
      canvasWidth,
      canvasHeight,
      clampToCanvas,
    ],
  );

  const handleRotationChange = useCallback((id: string, rotation: number) => {
    setPageTexts(prev => prev.map(t => 
      t.id === id ? { ...t, rotation } : t
    ));
  }, []);

  const handleFontSizeChange = useCallback((id: string, font_size: number) => {
    setPageTexts(prev => prev.map(t => 
      t.id === id ? { ...t, font_size } : t
    ));
  }, []);

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
    handleRotationChange,
    handleFontSizeChange,
  };
};