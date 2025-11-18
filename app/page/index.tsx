import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, LayoutChangeEvent, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

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
} from '@/src/db/dao';

// Toolbars
import { BottomToolbar } from '@/components/optionsPage/TolbarDown';
import PageToolbar from '@/components/optionsPage/TolbarUp';

// Canvas Skia
import SkiaCanvas from '@/components/optionsPage/PageCanvas';

// Modals
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

export default function PageView() {
  // ROUTER & PARAMS
  const { journalId, color, pageNumber, totalPages } = useLocalSearchParams<Params>();
  const router = useRouter();

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

  // MEMOIZED VALUES
  const pageNum = useMemo(() => Math.max(Number(pageNumber ?? 1) || 1, 1), [pageNumber]);
  const total = useMemo(() => Math.max(Number(totalPages ?? 1) || 1, 1), [totalPages]);

  // CUSTOM HOOKS
  const drawing = useSkiaDrawing(currentPageId);
  const textManager = usePageText(currentPageId, canvasSize.width, canvasSize.height);
  const shapeManager = usePageShapes(currentPageId, canvasSize.width, canvasSize.height);
  const stickerManager = usePageStickers(currentPageId);
  const audioManager = usePageAudios(currentPageId, canvasSize.width, canvasSize.height);
  const {
    pageImages,
    selectedImageId,
    setSelectedImageId,
    addImage,
    handleEditImage,
    handleDeleteImage,
    handleMoveEnd,
    handleResizeEnd,
    handleRotateEnd,
    handleDuplicateImage,
    replaceImage,
    loading: imagesLoading,
  } = usePageImages(currentPageId);

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

  // Mapea PageImage (DB) a Img (componente) — stable via useCallback
  const mapPageImageToImg = useCallback((p: PageImage): Img => {
    return {
      id: p.id,
      uri: p.uri,
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
  const parsePathDToPoints = (pathD: string): { x: number; y: number }[] => {
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
  };

  // EFFECTS - CARGAR COLOR DESDE PARÁMETROS
  useEffect(() => {
    if (typeof color === 'string') {
      const found = (pagePalette as readonly string[]).find(
        (c) => c.toLowerCase() === color.toLowerCase(),
      );
      setBg((found ?? pagePalette[0]) as (typeof pagePalette)[number]);
    } else {
      setBg(pagePalette[0]);
    }
  }, [color]);

  // EFFECTS - CARGAR COLOR DESDE BASE DE DATOS
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        const dbColor = await getPageColor(String(journalId), pageNum);

        if (mounted && typeof dbColor === 'string' && dbColor.length > 0) {
          const found = (pagePalette as readonly string[]).find(
            (c) => c.toLowerCase() === dbColor.toLowerCase(),
          );
          if (found) {
            setBg(found as (typeof pagePalette)[number]);
          }
        }
      } catch (error) {
        console.error('Error loading page color:', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [journalId, pageNum]);

  // EFFECTS - CARGAR PATRON
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        const dbPattern = await getPagePattern(String(journalId), pageNum);

        if (mounted && typeof dbPattern === 'string' && dbPattern.length > 0) {
          setPagePattern(dbPattern as PagePattern);
        } else {
          setPagePattern('none');
        }
      } catch (error) {
        console.error('Error loading page pattern:', error);
        setPagePattern('none');
      }
    })();

    return () => {
      mounted = false;
    };
  }, [journalId, pageNum]);

  // EFFECTS - CARGAR DATOS DE PÁGINA
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        let pageId = await getPageId(String(journalId), pageNum);

        if (!pageId) {
          const total = await getTotalPages(String(journalId));

          if (total === 0) {
            await createPage(String(journalId), String(bg), pagePattern);
            pageId = await getPageId(String(journalId), 1);
          }
        }

        if (mounted && pageId) {
          setCurrentPageId(pageId);

          // Cargar textos
          const texts = await listPageTexts(pageId);
          if (mounted) {
            textManager.setPageTexts((prev) => textManager.mergeById(prev, texts));

            const lockedState: Record<string, boolean> = {};
            texts.forEach((text) => {
              if (text.is_locked) {
                lockedState[text.id] = true;
              }
            });
            textManager.setLockedTextIds(lockedState);
          }

          // Cargar shapes
          if (mounted) {
            await shapeManager.loadShapes(pageId);
          }

          // Cargar dibujos
          try {
            const draws = await listPageDraws(pageId);
            if (mounted) {
              drawing.setStrokes(
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
            }
          } catch (e) {
            console.error('Error loading page draws:', e);
            if (mounted) drawing.setStrokes([]);
          }

          // Cargar stickers
          // El hook `usePageStickers` ya carga stickers cuando `pageId` cambia
        } else if (mounted) {
          setCurrentPageId(null);
          textManager.setPageTexts([]);
          drawing.setStrokes([]);
          textManager.setLockedTextIds({});
        }
      } catch (error) {
        console.error('Error loading page data:', error);
        if (mounted) {
          textManager.setPageTexts([]);
          drawing.setStrokes([]);
          textManager.setLockedTextIds({});
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [journalId, pageNum, bg]);

  // EFFECTS - LIMPIAR TRAZOS DE BORRADOR AL DESMONTAR
  useEffect(() => {
    return () => {
      drawing.clearEraserStrokes();
    };
  }, []);

  // EFFECTS - VALIDAR TOTAL DE PÁGINAS
  useEffect(() => {
    if (!journalId) return;
    let mounted = true;

    (async () => {
      try {
        const dbTotal = await getTotalPages(String(journalId));
        const safeTotal = Math.max(dbTotal, 1);

        if (mounted && (safeTotal !== total || pageNum > safeTotal)) {
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
  }, [journalId, pageNum, total, bg, router]);

  // CALLBACKS - GESTIÓN DE PÁGINAS

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
            const { pageNumber: target, total: newTotal } = await deletePage(
              String(journalId),
              pageNum,
            );

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
      const { pageNumber: newNum, total: newTotal } = await createPage(
        String(journalId),
        String(bg),
        pagePattern,
      );

      router.replace({
        pathname: '/page',
        params: {
          journalId,
          color: String(bg),
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
      await drawing.waitForPendingSaves();

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
    [journalId, bg, total, router, drawing],
  );

  // CALLBACKS - GESTIÓN DE HERRAMIENTAS

  const handleOpenTextOptions = useCallback(() => {
    drawing.setDrawMode(false);
    textManager.setEditingTextId(null);
    textManager.setTextInput('');
    setShowTextOptions(true);
  }, [drawing, textManager]);

  const handleOpenDrawTools = useCallback(() => {
    setShowDrawTools(true);
  }, []);

  const handleOpenShapeOptions = useCallback(() => {
    drawing.setDrawMode(false);
    setShowShapeOptions(true);
  }, [drawing]);

  const handleDoublePresShape = useCallback(
    (shape: any) => {
      drawing.setDrawMode(false);
      setSelectedShapeForColor(shape);
      setShowShapeColorModal(true);
    },
    [drawing],
  );

  const handleSaveShapeColor = useCallback(
    async (color: string) => {
      if (!selectedShapeForColor || !currentPageId) return;

      try {
        await updatePageShape(selectedShapeForColor.id, { color });

        // Recargar shapes para sincronizar desde BD
        if (currentPageId) {
          await shapeManager.loadShapes(currentPageId);
        }

        setShowShapeColorModal(false);
        setSelectedShapeForColor(null);
      } catch (error) {
        console.error('Error updating shape color:', error);
      }
    },
    [selectedShapeForColor, currentPageId, shapeManager],
  );

  const handleOpenStickerPicker = useCallback(() => {
    drawing.setDrawMode(false);
    setShowStickerPicker(true);
  }, [drawing]);

  const handleConfirmText = useCallback(() => {
    textManager.handleConfirmText(() => setShowTextOptions(false));
  }, [textManager]);

  const handleStartDrawing = useCallback(() => {
    setShowDrawTools(false);
    drawing.setDrawMode(true);
  }, [drawing]);

  const handleEditText = useCallback(
    (text: any) => {
      drawing.setDrawMode(false);
      textManager.handleEditTextRequest(text);
      setShowTextOptions(true);
    },
    [drawing, textManager],
  );

  const handleNavigateBack = useCallback(async () => {
    await drawing.waitForPendingSaves();

    router.replace({
      pathname: '/pageList',
      params: { journalId, color: String(bg) },
    });
  }, [router, journalId, bg, drawing]);

  // Capturar el botón back del dispositivo para evitar repetición de pantallas
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleNavigateBack();
      return true;
    });

    return () => backHandler.remove();
  }, [handleNavigateBack]);

  // CALLBACKS - GESTIÓN DE STICKERS
  const handleSelectSticker = useCallback(
    async (stickerId: string, category: string) => {
      const centerX = canvasSize.width > 0 ? canvasSize.width / 2 - 40 : 100;
      const centerY = canvasSize.height > 0 ? canvasSize.height / 2 - 40 : 100;

      await stickerManager.addSticker(
        stickerId,
        category,
        Number(centerX),
        Number(centerY),
        80,
        80,
      );
    },
    [stickerManager, canvasSize],
  );

  // CALLBACKS - GESTIÓN DE AUDIO
  const handleOpenAudioSelector = useCallback(() => {
    setIsAudioModalOpen(true);
  }, []);

  const handleAudioSelected = useCallback(
    async (audioUri: string, audioType: 'recording' | 'file') => {
      try {
        await audioManager.handleAddAudio(audioUri, audioType);
        setIsAudioModalOpen(false);
      } catch (error) {
        // El error ya se maneja en el hook
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

  // EDIT IMAGE MODAL STATE
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
    async (
      id: string,
      newUri: string,
      opts?: { width?: number; height?: number; rotation?: number },
    ) => {
      await replaceImage(id, newUri, opts);
      setEditingImage(null);
    },
    [replaceImage],
  );

  const handleCloseEditor = useCallback(() => {
    setEditingImage(null);
  }, []);

  // MEMOIZED VALUES - CONFIGURACIÓN DE TOOLBAR
  const toolbarItems = useMemo(
    () => [
      {
        id: 'delete',
        icon: 'delete-outline' as const,
        label: 'Eliminar',
        onPress: handleDeletePage,
        disabled: isLoading,
        isActive: false,
      },
      {
        id: 'add',
        icon: 'add' as const,
        label: 'Nueva',
        onPress: handleAddPage,
        disabled: isLoading,
        isActive: false,
      },
      {
        id: 'text',
        icon: 'text-fields' as const,
        label: 'Texto',
        onPress: handleOpenTextOptions,
        disabled: isLoading,
        isActive: showTextOptions,
      },
      {
        id: 'shape',
        icon: 'category' as const,
        label: 'Forma',
        onPress: handleOpenShapeOptions,
        disabled: isLoading,
        isActive: showShapeOptions,
      },
      {
        id: 'sticker',
        icon: 'mood' as const,
        label: 'Sticker',
        onPress: handleOpenStickerPicker,
        disabled: isLoading,
        isActive: showStickerPicker,
      },
      {
        id: 'draw',
        icon: 'edit' as const,
        label: 'Dibujar',
        onPress: handleOpenDrawTools,
        disabled: isLoading,
        isActive: showDrawTools,
      },
      {
        id: 'audio',
        icon: 'volume-up' as const,
        label: 'Audio',
        onPress: handleOpenAudioSelector,
        disabled: isLoading,
        isActive: false,
      },
      {
        id: 'image',
        icon: 'image' as const,
        label: 'Imagen',
        onPress: addImage,
        disabled: isLoading,
        isActive: false,
      },
    ],
    [
      handleAddPage,
      handleDeletePage,
      handleOpenTextOptions,
      handleOpenShapeOptions,
      handleOpenStickerPicker,
      handleOpenDrawTools,
      handleOpenAudioSelector,
      isLoading,
      showTextOptions,
      showShapeOptions,
      showStickerPicker,
      showDrawTools,
      addImage,
    ],
  );

  // ORDENAMIENTO
  const sortedPageTexts = useMemo(() => {
    return textManager.pageTexts.sort((a, b) => {
      if (a.id === textManager.selectedTextId) return 1;
      if (b.id === textManager.selectedTextId) return -1;
      return a.created_at - b.created_at;
    });
  }, [textManager.pageTexts, textManager.selectedTextId]);

  const sortedPageShapes = useMemo(() => {
    return shapeManager.pageShapes.sort((a, b) => {
      if (a.id === shapeManager.selectedShapeId) return 1;
      if (b.id === shapeManager.selectedShapeId) return -1;
      return a.created_at - b.created_at;
    });
  }, [shapeManager.pageShapes, shapeManager.selectedShapeId]);

  const sortedPageStickers = useMemo(() => {
    return stickerManager.stickers.sort((a, b) => {
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

  // RENDER
  return (
    <SafeAreaView
      style={[S.container, { backgroundColor: TOOLBAR_BG }]}
      edges={['top', 'left', 'right']}
    >
      {/* Overlay de carga */}
      {(isLoading || audioManager.isLoading) && (
        <View style={S.loadingOverlay}>
          <ActivityIndicator size="large" color={uiColors.danger} />
        </View>
      )}

      {/* Toolbar superior */}
      <PageToolbar
        pageNum={pageNum}
        total={total}
        isLoading={isLoading}
        onBack={handleNavigateBack}
        onDone={handleNavigateBack}
        onPrevPage={() => navigateToPage(pageNum - 1)}
        onNextPage={() => navigateToPage(pageNum + 1)}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={false}
        canRedo={false}
      />

      {/* Contenido de la página */}
      <View style={S.pageContent}>
        <View style={[S.pageCard, { backgroundColor: bg }]} onLayout={handleCanvasLayout}>
          {/* Renderizar el patrón de fondo */}
          {canvasSize.width > 0 && canvasSize.height > 0 && (
            <PagePatternBackground
              pattern={pagePattern}
              width={canvasSize.width}
              height={canvasSize.height}
              color={uiColors.gray}
            />
          )}
          <SkiaCanvas
            width={canvasSize.width}
            height={canvasSize.height}
            strokes={drawing.strokes}
            currentStroke={drawing.currentStroke}
            pointsToPath={drawing.pointsToPath}
            drawMode={drawing.drawMode}
            onDrawStart={drawing.onDrawStart}
            onDrawMove={drawing.onDrawMove}
            onDrawEnd={drawing.onDrawEnd}
            onDeselect={() => {
              textManager.setSelectedTextId(null);
              shapeManager.setSelectedShapeId(null);
              stickerManager.setSelectedStickerId(null);
              audioManager.setSelectedAudioId(null);
              setSelectedImageId(null);
            }}
          >
            {/* Textos arrastrables */}
            {sortedPageTexts.map((text) => (
              <DraggableText
                key={text.id}
                text={text}
                currentPageId={currentPageId}
                handleDeleteText={textManager.handleDeleteText}
                getPanFor={textManager.getPanFor}
                onPositionCommit={textManager.commitTextPosition}
                locked={!!textManager.lockedTextIds[text.id]}
                isSelected={textManager.selectedTextId === text.id}
                onToggleLock={textManager.handleToggleLock}
                onSelect={textManager.handleSelectText}
                onEdit={handleEditText}
                onDuplicate={textManager.handleDuplicateText}
                onRotationChange={textManager.handleRotationChange}
                onFontSizeChange={textManager.handleFontSizeChange}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
              />
            ))}

            {/* Shapes arrastrables */}
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

            {/* Imágenes arrastrables */}
            {memoizedPageImgs.map((img) => (
              <DraggableImage
                key={img.id}
                image={img}
                isSelected={selectedImageId === img.id}
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

            {/* Edit Image Modal */}
            <EditImageModal
              visible={!!editingImage}
              image={editingImage}
              onClose={handleCloseEditor}
              onSave={handleSaveEditedImage}
            />

            {/* Stickers arrastrables */}
            {sortedPageStickers.map((sticker) => (
              <PageStickerComponent
                key={sticker.id}
                sticker={sticker}
                isSelected={stickerManager.selectedStickerId === sticker.id}
                onSelect={() => stickerManager.setSelectedStickerId(sticker.id)}
                onUpdate={(updates) => stickerManager.updateSticker(sticker.id, updates)}
                onDelete={() => stickerManager.removeSticker(sticker.id)}
                onDuplicate={() => stickerManager.duplicateSticker(sticker.id)}
                onToggleLock={() => stickerManager.toggleLock(sticker.id, !sticker.is_locked)}
                scale={1}
              />
            ))}

            {/* Audios arrastrables */}
            {currentPageId &&
              sortedAudios.map((audio) => (
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
                  getPanFor={audioManager.getPanForAudio}
                  onPositionCommit={audioManager.handleAudioPositionCommit}
                  onDelete={audioManager.handleDeleteAudio}
                  onToggleLock={audioManager.handleToggleAudioLock}
                  onSelect={handleSelectAudio}
                  onDuplicate={audioManager.handleDuplicateAudio}
                  locked={audio.is_locked === 1}
                  isSelected={audioManager.selectedAudioId === audio.id}
                />
              ))}
          </SkiaCanvas>
        </View>
      </View>

      {/* Toolbar inferior */}
      <BottomToolbar items={toolbarItems} />

      {/* Modal de opciones de texto */}
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

      {/* Modal de opciones de formas */}
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

      {/* Modal para editar color de una forma existente (doble tap) */}
      <ShapeColorEditModal
        visible={showShapeColorModal}
        onClose={() => setShowShapeColorModal(false)}
        initialColor={selectedShapeForColor?.color ?? shapeManager.selectedShapeColor}
        onSaveColor={handleSaveShapeColor}
      />

      {/* Modal de herramientas de dibujo */}
      <DrawToolsModal
        visible={showDrawTools}
        onClose={() => setShowDrawTools(false)}
        selectedTool={drawing.selectedTool}
        onToolSelect={drawing.handleSelectTool}
        selectedColor={drawing.selectedColor}
        onColorSelect={drawing.setSelectedColor}
        strokeWidth={drawing.strokeWidth}
        onStrokeWidthChange={drawing.setStrokeWidth}
        eraserWidth={drawing.eraserWidth}
        onEraserWidthChange={drawing.setEraserWidth}
        onStartDrawing={handleStartDrawing}
      />

      {/* Modal de selector de stickers */}
      <StickerPickerModal
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleSelectSticker}
      />

      {/* Modal de selector de audio */}
      <AudioSelector
        visible={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onAudioSelected={handleAudioSelected}
      />
    </SafeAreaView>
  );
}
