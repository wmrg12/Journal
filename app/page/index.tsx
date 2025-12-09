// PageView.tsx 
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, LayoutChangeEvent, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Constants
import { pagePalette, uiColors } from '@/constants/colors';

// Styles
import S from '@/styles/pageViewStyles';

// Database
import {
  createPage,
  deletePage,
  getPageColor,
  getPageId,
  getTotalPages,
  listPageDraws,
  listPageTexts,
  updatePageShape,
  PageAudio,
  getPagePattern,
  updatePagePattern,
  updatePageColor,
  updateAllPagesColor,
} from '@/src/db/dao';

// Toolbars
import { BottomToolbar } from '@/components/optionsPage/TolbarDown';
import PageToolbar from '@/components/optionsPage/TolbarUp';
import { PageSettingsModal } from '@/components/optionsPage/PageSettingsModal';

// Canvas Skia
import SkiaCanvas from '@/components/optionsPage/PageCanvas';

// Modals / Components
import { AudioSelector } from '@/components/optionsPage/AudioSelector';
import { DraggableShape } from '@/components/optionsPage/DraggableShape';
import { PageStickerComponent } from '@/components/optionsPage/DraggableSticker';
import { DraggableText } from '@/components/optionsPage/DraggableText';
import { DraggableImage } from '@/components/optionsPage/DraggableImage';
import { DraggableAudio } from '@/components/optionsPage/DraggableAudio';
import { DrawToolsModal } from '@/components/optionsPage/DrawToolsModal';
import { ShapeColorEditModal } from '@/components/optionsPage/ShapeColorEditModal';
import { ShapeOptionsModal } from '@/components/optionsPage/ShapeOptionsModal';
import { StickerPickerModal } from '@/components/optionsPage/StickerOptionsModal';
import { TextOptionsModal } from '@/components/optionsPage/TextOptionsModal';
import EditImageModal from '@/components/optionsPage/EditImageModal';
import { PagePattern, PagePatternBackground } from '@/components/optionsCreatePage/PagePatterns';

// Hooks
import { useSkiaDrawing } from '@/hooks/usePage/usePageDrawing';
import { usePageShapes } from '@/hooks/usePage/usePageShapes';
import { usePageStickers } from '@/hooks/usePage/usePageStickers';
import { usePageText } from '@/hooks/usePage/usePageTexts';
import { PageImage, usePageImages } from '@/hooks/usePage/usePageImages';
import { usePageAudios } from '@/hooks/usePage/usePageAudio';

// Types
import { Params } from '@/types';

const normalizeImageUri = (uri: string): string => {
  if (!uri) return '';
  
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  
  if (uri.startsWith('file://')) {
    return uri;
  }
  
  return `file://${uri}`;
};

export default function PageView() {
  // ROUTER & PARAMS
  const { journalId, color, pageNumber, totalPages } = useLocalSearchParams<Params>();
  const router = useRouter();
  
  // AUTH
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // STATE
  const [bg, setBg] = useState<(typeof pagePalette)[number]>(pagePalette[0]);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [showTextOptions, setShowTextOptions] = useState(false);
  const [showShapeOptions, setShowShapeOptions] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showShapeColorModal, setShowShapeColorModal] = useState(false);
  const [selectedShapeForColor, setSelectedShapeForColor] = useState<any>(null);
  const [pagePattern, setPagePattern] = useState<PagePattern>('none');
  const [showPageSettings, setShowPageSettings] = useState(false);

  // MEMOIZED VALUES
  const pageNum = useMemo(() => Math.max(Number(pageNumber ?? 1) || 1, 1), [pageNumber]);
  const total = useMemo(() => Math.max(Number(totalPages ?? 1) || 1, 1), [totalPages]);

  // CUSTOM HOOKS
  const safeGetToken = useCallback(async () => {
    try {
      if (!getToken) {
        console.error(' getToken no está disponible');
        return null;
      }
      return await getToken({ template: 'supabase' });
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }, [getToken]);

  const drawing = useSkiaDrawing(currentPageId);

  const {
    strokes,
    setStrokes,
    currentStroke,
    drawMode,
    setDrawMode,
    selectedTool,
    selectedColor,
    setSelectedColor,
    strokeWidth,
    setStrokeWidth,
    eraserWidth,
    setEraserWidth,
    onDrawStart,
    onDrawMove,
    onDrawEnd,
    handleSelectTool,
    pointsToPath,
    clearEraserStrokes,
    waitForPendingSaves,
    stopDrawing,
  } = drawing;

  const textManager = usePageText(currentPageId, canvasSize.width, canvasSize.height);
  const shapeManager = usePageShapes(currentPageId, canvasSize.width, canvasSize.height);
  const stickerManager = usePageStickers(currentPageId);
  const audioManager = usePageAudios(currentPageId, canvasSize.width, canvasSize.height, safeGetToken);

  const {
    pageImages,
    selectedImageId,
    setSelectedImageId,
    addImage,
    handleDeleteImage,
    handleMoveEnd,
    handleResizeEnd,
    handleRotateEnd,
    handleDuplicateImage,
    replaceImage,
    loading: imagesLoading,
    downloadingIds: imageDownloadingIds, 
  } = usePageImages(currentPageId, safeGetToken);


  // HANDLER PARA MEDIR EL CANVAS
  const handleCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setCanvasSize((prev) => {
        if (prev.width !== width || prev.height !== height) {
          return { width, height };
        }
        return prev;
      });
    }
  }, []);

  // ---------- Tipo local Img (para DraggableImage + modal) ----------
  type Img = {
    id: string;
    uri: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
  };

  const mapPageImageToImg = useCallback((p: PageImage): Img => {
    return {
      id: p.id,
      uri: normalizeImageUri(p.uri), 
      x: (p as any).position_x ?? (p as any).x ?? 0,
      y: (p as any).position_y ?? (p as any).y ?? 0,
      width: (p as any).width ?? 120,
      height: (p as any).height ?? 120,
      rotation: (p as any).rotation ?? 0,
    };
  }, []);

  // Memoiza la conversión completa de la lista para evitar crear nuevos objetos cada render
  const memoizedPageImgs = useMemo(
    () => pageImages.map(mapPageImageToImg),
    [pageImages, mapPageImageToImg],
  );

  // Helper para convertir path SVG a puntos
  const parsePathDToPoints = useCallback((pathD: string): { x: number; y: number }[] => {
    if (!pathD) return [];

    const points: { x: number; y: number }[] = [];
    const commands = pathD.trim().split(/\s+/);

    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd === 'M' || cmd === 'L') {
        const x = parseFloat(commands[i + 1]);
        const y = parseFloat(commands[i + 2]);
        if (!isNaN(x) && !isNaN(y)) {
          points.push({ x, y });
        }
        i += 2;
      }
    }

    return points;
  }, []);

  // -----------------------------
  // useEffect: color desde params (solo actualiza si cambia)
  // -----------------------------
  useEffect(() => {
    if (typeof color !== 'string') {
      if (bg !== pagePalette[0]) setBg(pagePalette[0]);
      return;
    }

    const found = pagePalette.find((c) => c.toLowerCase() === color.toLowerCase());
    const newColor = found ?? pagePalette[0];
    if (newColor !== bg) {
      setBg(newColor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]); // solo depende de `color`

  // -----------------------------
  // useEffect: cargar color desde BD
  // -----------------------------
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        const dbColor = await getPageColor(String(journalId), pageNum);
        if (!mounted || !dbColor) return;

        const found = pagePalette.find((c) => c.toLowerCase() === dbColor.toLowerCase());
        if (found && found !== bg) {
          // actualiza solo si cambia
          setBg(found);
        }
      } catch (e) {
        console.error('Error loading page color:', e);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId, pageNum]); // evitamos incluir `bg` aquí para no provocar loops

  // -----------------------------
  // useEffect: cargar patrón 
  // -----------------------------
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        const dbPattern = await getPagePattern(String(journalId), pageNum);
        if (!mounted) return;

        const newPattern = typeof dbPattern === 'string' && dbPattern.length > 0 ? (dbPattern as PagePattern) : 'none';
        if (newPattern !== pagePattern) setPagePattern(newPattern);
      } catch (error) {
        console.error('Error loading page pattern:', error);
        if (mounted && pagePattern !== 'none') setPagePattern('none');
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId, pageNum]); // no incluimos pagePattern para evitar loops

  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        let pageId = await getPageId(String(journalId), pageNum);

        if (!pageId) {
          // Si no existe página alguna, crear una con el color actual (lectura única)
          const totalPagesDb = await getTotalPages(String(journalId));
          if (totalPagesDb === 0) {
            await createPage(String(journalId), String(bg), 'none');
            pageId = await getPageId(String(journalId), 1);
          }
        }

        if (mounted && pageId) {
          setCurrentPageId(pageId);

          // Cargar textos
          const texts = await listPageTexts(pageId);
          if (!mounted) return;
          textManager.setPageTexts((prev) => textManager.mergeById(prev, texts));
          const lockedState: Record<string, boolean> = {};
          texts.forEach((t) => {
            if (t.is_locked) lockedState[t.id] = true;
          });
          textManager.setLockedTextIds(lockedState);

          // Cargar shapes
          await shapeManager.loadShapes(pageId);

          // Cargar dibujos
          try {
            const draws = await listPageDraws(pageId);
            if (!mounted) return;
            setStrokes(
              draws.map((d) => ({
                id: d.id,
                tool: d.tool as any,
                color: d.color,
                width: d.width,
                opacity: d.opacity,
                points: parsePathDToPoints(d.path_d),
                _persistedPathD: d.path_d,
              })),
            );
          } catch (e) {
            console.error('Error loading page draws:', e);
            if (mounted) setStrokes([]);
          }
        } else if (mounted) {
          setCurrentPageId(null);
          textManager.setPageTexts([]);
          setStrokes([]);
          textManager.setLockedTextIds({});
        }
      } catch (error) {
        console.error('Error loading page data:', error);
        if (mounted) {
          textManager.setPageTexts([]);
          setStrokes([]);
          textManager.setLockedTextIds({});
        }
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId, pageNum]); // importante: NO incluir `bg` para evitar loops

  // EFFECTS - LIMPIAR TRAZOS DE BORRADOR AL DESMONTAR
  useEffect(() => {
    return () => {
      clearEraserStrokes();
    };
    // clearEraserStrokes es estable si tu hook lo memoiza; si no lo es, quizá necesites adaptarlo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // EFFECTS - VALIDAR TOTAL DE PÁGINAS 
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        const dbTotal = await getTotalPages(String(journalId));
        const safeTotal = Math.max(dbTotal, 1);
        if (!mounted) return;

        if (safeTotal !== total || pageNum > safeTotal) {
          router.replace({
            pathname: '/page',
            params: {
              journalId,
              color: String(bg),
              pageNumber: String(Math.min(pageNum, safeTotal)),
              totalPages: String(safeTotal),
            },
          });
        }
      } catch (error) {
        console.error('Error validating pages:', error);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId, pageNum, total]); // no incluir bg/router

  // -----------------------------
  // CALLBACKS
  // -----------------------------
  const handleDeletePage = useCallback(() => {
    if (total <= 1 || !journalId) {
      Alert.alert('No se puede eliminar', 'Debe existir al menos una página.');
      return;
    }

    Alert.alert('Eliminar página', `¿Eliminar la página ${pageNum}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          try {
            const { pageNumber: target, total: newTotal } = await deletePage(String(journalId), pageNum);

            router.replace({
              pathname: '/page',
              params: {
                journalId,
                color: String(bg),
                pageNumber: String(target),
                totalPages: String(newTotal),
              },
            });
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo eliminar la página.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  }, [total, journalId, pageNum, bg, router]);

  const handleAddPage = useCallback(async () => {
    if (!journalId) return;

    setIsLoading(true);
    try {
      
      const { pageNumber: newNum, total: newTotal } = await createPage(String(journalId), bg, pagePattern);
      
      router.replace({
        pathname: '/page',
        params: {
          journalId,
          color: bg,
          pageNumber: String(newNum),
          totalPages: String(newTotal),
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo crear la página.');
    } finally {
      setIsLoading(false);
    }
  }, [journalId, bg, pagePattern, router]);

  const navigateToPage = useCallback(
    async (newPageNum: number) => {
      await waitForPendingSaves();

      router.replace({
        pathname: '/page',
        params: {
          journalId,
          color: String(bg),
          pageNumber: String(newPageNum),
          totalPages: String(total),
        },
      });
    },
    [journalId, bg, total, router, waitForPendingSaves],
  );

  // CALLBACKS - HERRAMIENTAS
  const handleOpenTextOptions = useCallback(() => {
    setDrawMode(false);
    textManager.setEditingTextId(null);
    textManager.setTextInput('');
    setShowTextOptions(true);
  }, [setDrawMode, textManager]);

  const handleOpenDrawTools = useCallback(() => {
    setShowDrawTools(true);
  }, []);

  const handleOpenShapeOptions = useCallback(() => {
    setDrawMode(false);
    setShowShapeOptions(true);
  }, [setDrawMode]);

  const handleDoublePresShape = useCallback(
    (shape: any) => {
      setDrawMode(false);
      setSelectedShapeForColor(shape);
      setShowShapeColorModal(true);
    },
    [setDrawMode],
  );

  const handleSaveShapeColor = useCallback(
    async (color: string) => {
      if (!selectedShapeForColor || !currentPageId) return;
      try {
        await updatePageShape(selectedShapeForColor.id, { color });
        if (currentPageId) await shapeManager.loadShapes(currentPageId);
        setShowShapeColorModal(false);
        setSelectedShapeForColor(null);
      } catch (error) {
        console.error('Error updating shape color:', error);
      }
    },
    [selectedShapeForColor, currentPageId, shapeManager],
  );

  const handleOpenStickerPicker = useCallback(() => {
    setDrawMode(false);
    setShowStickerPicker(true);
  }, [setDrawMode]);

  const handleConfirmText = useCallback(() => {
    textManager.handleConfirmText(() => setShowTextOptions(false));
  }, [textManager]);

  const handleStartDrawing = useCallback(() => {
    setShowDrawTools(false);
    setDrawMode(true);
  }, [setDrawMode]);

  const handleEditText = useCallback(
    (text: any) => {
      setDrawMode(false);
      textManager.handleEditTextRequest(text);
      setShowTextOptions(true);
    },
    [setDrawMode, textManager],
  );

  const handleNavigateBack = useCallback(async () => {
    await waitForPendingSaves();
    stopDrawing();
    router.replace({
      pathname: '/pageList',
      params: { journalId, color: String(bg) },
    });
  }, [waitForPendingSaves, stopDrawing, router, journalId, bg]);

  // Capturar el botón back del dispositivo
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleNavigateBack();
      return true;
    });

    return () => backHandler.remove();
  }, [handleNavigateBack]);

  // CALLBACKS - STICKERS
  const handleSelectSticker = useCallback(
    async (stickerId: string, category: string) => {
      const centerX = canvasSize.width > 0 ? canvasSize.width / 2 - 40 : 100;
      const centerY = canvasSize.height > 0 ? canvasSize.height / 2 - 40 : 100;

      await stickerManager.addSticker(stickerId, category, Number(centerX), Number(centerY), 80, 80);
    },
    [stickerManager, canvasSize],
  );

  // AUDIO
  const handleOpenAudioSelector = useCallback(() => {
    setIsAudioModalOpen(true);
  }, []);

  const handleAudioSelected = useCallback(
    async (audioUri: string, audioType: 'recording' | 'file') => {
      try {
        await audioManager.handleAddAudio(audioUri, audioType);
        setIsAudioModalOpen(false);
      } catch (error) {
        // error manejado en hook
      }
    },
    [audioManager],
  );

  const handleSelectAudio = useCallback(
    (audioId: string) => {
      audioManager.handleSelectAudio(audioId);
      textManager.setSelectedTextId(null);
      shapeManager.setSelectedShapeId(null);
      stickerManager.setSelectedStickerId(null);
      setSelectedImageId(null);
    },
    [audioManager, textManager, shapeManager, stickerManager, setSelectedImageId],
  );

  // SETTINGS PAGE
  const handleSavePageSettings = useCallback(
    async (newColor: string, newPattern: PagePattern, colorScope: 'current' | 'all') => {
      if (!journalId) return;

      try {
        setIsLoading(true);

        if (newColor !== bg) {
          if (colorScope === 'all') {
            await updateAllPagesColor(String(journalId), newColor);
            Alert.alert('Color actualizado', 'El color se aplicó a todas las páginas del diario.');
          } else {
            await updatePageColor(String(journalId), pageNum, newColor);
          }
          setBg(newColor as (typeof pagePalette)[number]);
        }

        if (newPattern !== pagePattern) {
          await updatePagePattern(String(journalId), pageNum, newPattern);
          setPagePattern(newPattern);
        }
      } catch (error) {
        console.error('Error updating page settings:', error);
        Alert.alert('Error', 'No se pudieron guardar los cambios.');
      } finally {
        setIsLoading(false);
      }
    },
    [journalId, pageNum, bg, pagePattern],
  );

  const handleOpenPageSettings = useCallback(() => {
    setShowPageSettings(true);
  }, []);

  // EDIT IMAGE MODAL
  const [editingImage, setEditingImage] = useState<null | Img>(null);

  const openImageEditor = useCallback(
    (id: string) => {
      const p = pageImages.find((i) => i.id === id);
      if (p) {
        const img = mapPageImageToImg(p);
        setEditingImage(img);
        setSelectedImageId(id);
      }
    },
    [pageImages, mapPageImageToImg, setSelectedImageId],
  );

  const handleSaveEditedImage = useCallback(
    async (id: string, newUri: string, opts?: { width?: number; height?: number; rotation?: number }) => {
      await replaceImage(id, newUri, opts);
      setEditingImage(null);
    },
    [replaceImage],
  );

  const handleCloseEditor = useCallback(() => {
    setEditingImage(null);
  }, []);

  // TOOLBAR ITEMS
  const toolbarItems = useMemo(
    () => [
      { id: 'delete', icon: 'delete-outline' as const, label: 'Eliminar', onPress: handleDeletePage, disabled: isLoading, isActive: false },
      { id: 'add', icon: 'add' as const, label: 'Nueva', onPress: handleAddPage, disabled: isLoading, isActive: false },
      { id: 'text', icon: 'text-fields' as const, label: 'Texto', onPress: handleOpenTextOptions, disabled: isLoading, isActive: showTextOptions },
      { id: 'shape', icon: 'category' as const, label: 'Forma', onPress: handleOpenShapeOptions, disabled: isLoading, isActive: showShapeOptions },
      { id: 'sticker', icon: 'mood' as const, label: 'Sticker', onPress: handleOpenStickerPicker, disabled: isLoading, isActive: showStickerPicker },
      { id: 'draw', icon: 'edit' as const, label: 'Dibujar', onPress: handleOpenDrawTools, disabled: isLoading, isActive: showDrawTools },
      { id: 'audio', icon: 'volume-up' as const, label: 'Audio', onPress: handleOpenAudioSelector, disabled: isLoading, isActive: false },
      { id: 'image', icon: 'image' as const, label: 'Imagen', onPress: addImage, disabled: isLoading, isActive: false },
      { id: 'settings', icon: 'palette' as const, label: 'Estilo', onPress: handleOpenPageSettings, disabled: isLoading, isActive: showPageSettings },
    ],
    [handleAddPage, handleDeletePage, handleOpenTextOptions, handleOpenShapeOptions, handleOpenStickerPicker, handleOpenDrawTools, handleOpenAudioSelector, handleOpenPageSettings, isLoading, showTextOptions, showShapeOptions, showStickerPicker, showDrawTools, showPageSettings, addImage],
  );

  // ORDENAMIENTOS (usamos referencias estables desde managers)
  const sortedPageTexts = useMemo(() => {
    return [...textManager.pageTexts].sort((a, b) => {
      if (a.id === textManager.selectedTextId) return 1;
      if (b.id === textManager.selectedTextId) return -1;
      return a.created_at - b.created_at;
    });
  }, [textManager.pageTexts, textManager.selectedTextId]);

  const sortedPageShapes = useMemo(() => {
    return [...shapeManager.pageShapes].sort((a, b) => {
      if (a.id === shapeManager.selectedShapeId) return 1;
      if (b.id === shapeManager.selectedShapeId) return -1;
      return a.created_at - b.created_at;
    });
  }, [shapeManager.pageShapes, shapeManager.selectedShapeId]);

  const sortedPageStickers = useMemo(() => {
    return [...stickerManager.stickers].sort((a, b) => {
      if (a.id === stickerManager.selectedStickerId) return 1;
      if (b.id === stickerManager.selectedStickerId) return -1;
      return a.created_at - b.created_at;
    });
  }, [stickerManager.stickers, stickerManager.selectedStickerId]);

  const sortedAudios = useMemo(() => {
    return [...audioManager.audios].sort((a: PageAudio, b: PageAudio) => {
      if (a.id === audioManager.selectedAudioId) return 1;
      if (b.id === audioManager.selectedAudioId) return -1;
      return a.created_at - b.created_at;
    });
  }, [audioManager.audios, audioManager.selectedAudioId]);

  const TOOLBAR_BG = uiColors.background;

    if (!isLoaded || !isSignedIn) {
    return (
      <SafeAreaView style={[S.container, { backgroundColor: uiColors.background }]} edges={['top', 'left', 'right']}>
        <View style={S.loadingOverlay}>
          <ActivityIndicator size="large" color={uiColors.danger} />
        </View>
      </SafeAreaView>
    );
  }

  // RENDER
  return (
    <SafeAreaView style={[S.container, { backgroundColor: TOOLBAR_BG }]} edges={['top', 'left', 'right']}>
      {(isLoading || audioManager.isLoading) && (
        <View style={S.loadingOverlay}>
          <ActivityIndicator size="large" color={uiColors.danger} />
        </View>
      )}

      <PageToolbar
        pageNum={pageNum}
        total={total}
        isLoading={isLoading}
        onBack={handleNavigateBack}
        onDone={handleNavigateBack}
        onPrevPage={() => navigateToPage(pageNum - 1)}
        onNextPage={() => navigateToPage(pageNum + 1)}
      />

      <View style={S.pageContent}>
        <View style={[S.pageCard, { backgroundColor: bg }]} onLayout={handleCanvasLayout}>
          {canvasSize.width > 0 && canvasSize.height > 0 && (
            <PagePatternBackground pattern={pagePattern} width={canvasSize.width} height={canvasSize.height} color={uiColors.gray} />
          )}

          <SkiaCanvas
            strokes={strokes}
            currentStroke={currentStroke}
            pointsToPath={pointsToPath}
            drawMode={drawMode}
            onDrawStart={onDrawStart}
            onDrawMove={onDrawMove}
            onDrawEnd={onDrawEnd}
            onDeselect={() => {
              textManager.setSelectedTextId(null);
              shapeManager.setSelectedShapeId(null);
              stickerManager.setSelectedStickerId(null);
              audioManager.setSelectedAudioId(null);
              setSelectedImageId(null);
            }}
          >

            {sortedPageShapes.map((shape) => (
              <DraggableShape
                key={shape.id}
                shape={shape}
                currentPageId={currentPageId}
                handleDeleteShape={shapeManager.handleDeleteShape}
                getPanFor={shapeManager.getPanForShape}
                onPositionCommit={shapeManager.commitShapePosition}
                locked={!!shapeManager.lockedShapeIds[shape.id]}
                isSelected={shapeManager.selectedShapeId === shape.id}
                onToggleLock={shapeManager.handleToggleLock}
                onSelect={(id) => shapeManager.setSelectedShapeId(id)}
                onDuplicate={shapeManager.handleDuplicateShape}
                onDoublePress={handleDoublePresShape}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
              />
            ))}

            {memoizedPageImgs.map((img) => (
              <DraggableImage
                key={img.id}
                image={img}
                isSelected={selectedImageId === img.id}
                isDownloading={imageDownloadingIds.has(img.id)}
                onSelect={(id: string) => setSelectedImageId(id)}
                onDelete={handleDeleteImage}
                onEdit={openImageEditor}
                onMoveEnd={handleMoveEnd}
                onResizeEnd={handleResizeEnd}
                onRotateEnd={handleRotateEnd}
                onDuplicate={handleDuplicateImage}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
              />
            ))}

              {sortedPageStickers.map((sticker, index) => (
              <PageStickerComponent
                key={sticker.id}
                sticker={sticker}
                zIndex={4000 + index} 
                isSelected={stickerManager.selectedStickerId === sticker.id}
                onSelect={() => stickerManager.setSelectedStickerId(sticker.id)}
                onUpdate={(updates) => stickerManager.updateSticker(sticker.id, updates)}
                onDelete={() => stickerManager.removeSticker(sticker.id)}
                onDuplicate={() => stickerManager.duplicateSticker(sticker.id)}
                onToggleLock={() => stickerManager.toggleLock(sticker.id, !sticker.is_locked)}
                scale={1}
              />
            ))}

            {sortedPageTexts.map((text, index) => (
              <DraggableText
                key={text.id}
                text={text}
                zIndex={5000 + index} 
                currentPageId={currentPageId}
                handleDeleteText={textManager.handleDeleteText}
                getPanFor={textManager.getPanFor}
                onPositionCommit={textManager.commitTextPosition}
                locked={!!textManager.lockedTextIds[text.id]}
                isSelected={textManager.selectedTextId === text.id}
                onToggleLock={textManager.handleToggleLock}
                onSelect={textManager.handleSelectText}
                onEdit={(t) => {
                  setDrawMode(false);
                  handleEditText(t);
                }}
                onDuplicate={textManager.handleDuplicateText}
                onRotationChange={textManager.handleRotationChange}
                onFontSizeChange={textManager.handleFontSizeChange}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
              />
            ))}

            {currentPageId &&
              sortedAudios.map((audio, index) => (
                <DraggableAudio
                  key={audio.id}
                  audio={{
                    id: audio.id,
                    page_id: audio.page_id,
                    audio_uri: audio.audio_uri,
                    audio_type: audio.audio_type,
                    position_x: audio.position_x,
                    position_y: audio.position_y,
                    is_locked: audio.is_locked === 1,
                    created_at: audio.created_at,
                  }}
                  zIndex={6000 + index}
                  getPanFor={audioManager.getPanForAudio}
                  onPositionCommit={audioManager.handleAudioPositionCommit}
                  onDelete={audioManager.handleDeleteAudio}
                  onToggleLock={audioManager.handleToggleAudioLock}
                  onSelect={handleSelectAudio}
                  onDuplicate={audioManager.handleDuplicateAudio}
                  locked={audio.is_locked === 1}
                  isSelected={audioManager.selectedAudioId === audio.id}
                  isDownloading={audioManager.downloadingIds?.has(audio.id) ?? false}   
                />
              ))}

          </SkiaCanvas>
        </View>
      </View>

      <BottomToolbar items={toolbarItems} />
      <EditImageModal visible={!!editingImage} image={editingImage} onClose={handleCloseEditor} onSave={handleSaveEditedImage} />

      <TextOptionsModal
        visible={showTextOptions}
        onClose={() => setShowTextOptions(false)}
        textInput={textManager.textInput}
        onTextChange={textManager.setTextInput}
        selectedTextColor={textManager.selectedTextColor}
        onColorSelect={textManager.setSelectedTextColor}
        selectedFont={textManager.selectedFont}
        onFontSelect={textManager.setSelectedFont}
        onConfirm={handleConfirmText}
        isEditing={!!textManager.editingTextId}
      />

      <ShapeOptionsModal
        visible={showShapeOptions}
        onClose={() => setShowShapeOptions(false)}
        selectedShapeType={shapeManager.selectedShapeType}
        onSelectShapeType={shapeManager.setSelectedShapeType}
        selectedShapeColor={shapeManager.selectedShapeColor}
        onSelectShapeColor={shapeManager.setSelectedShapeColor}
        onAddShape={async () => {
          await shapeManager.handleAddShape();
          setShowShapeOptions(false);
        }}
      />

      <ShapeColorEditModal
        visible={showShapeColorModal}
        onClose={() => setShowShapeColorModal(false)}
        initialColor={selectedShapeForColor?.color ?? shapeManager.selectedShapeColor}
        onSaveColor={handleSaveShapeColor}
      />

      <DrawToolsModal
        visible={showDrawTools}
        onClose={() => setShowDrawTools(false)}
        selectedTool={selectedTool}
        onToolSelect={handleSelectTool}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        eraserWidth={eraserWidth}
        onEraserWidthChange={setEraserWidth}
        onStartDrawing={handleStartDrawing}
        onStopDrawing={() => {
          stopDrawing();
          setShowDrawTools(false);
        }}
      />

      <StickerPickerModal visible={showStickerPicker} onClose={() => setShowStickerPicker(false)} onSelectSticker={handleSelectSticker} />

      <AudioSelector visible={isAudioModalOpen} onClose={() => setIsAudioModalOpen(false)} onAudioSelected={handleAudioSelected} />

      <PageSettingsModal visible={showPageSettings} onClose={() => setShowPageSettings(false)} currentColor={bg} currentPattern={pagePattern} onSave={handleSavePageSettings} />
    </SafeAreaView>
  );
}
