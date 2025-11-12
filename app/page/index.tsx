import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, ActivityIndicator, Alert, LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Constants
import { pagePalette, uiColors } from '@/constants/colors';

// Styles
import S from '@/styles/pageViewStyles';

// Database
import {
  createPage,
  deletePage,
  getTotalPages,
  getPageColor,
  getPageId,
  listPageTexts,
  listPageDraws,
} from '@/src/db/dao';

// Toolbars
import PageToolbar from '@/components/optionsPage/TolbarUp';
import { BottomToolbar } from '@/components/optionsPage/TolbarDown';

// Canvas Skia
import SkiaCanvas from '@/components/optionsPage/PageCanvas';

// Modals
import { DrawToolsModal } from '@/components/optionsPage/DrawToolsModal';
import { DraggableText } from '@/components/optionsPage/DraggableText';
import { DraggableShape } from '@/components/optionsPage/DraggableShape';
import { TextOptionsModal } from '@/components/optionsPage/TextOptionsModal';
import { ShapeOptionsModal } from '@/components/optionsPage/ShapeOptionsModal';
import { AudioSelector } from '@/components/optionsPage/AudioSelector';

// Hooks
import { useSkiaDrawing } from '@/hooks/usePage/usePageDrawing';
import { usePageText } from '@/hooks/usePage/usePageTexts';
import { usePageShapes } from '@/hooks/usePage/usePageShapes';

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
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // MEMOIZED VALUES
  const pageNum = useMemo(() => Math.max(Number(pageNumber ?? 1) || 1, 1), [pageNumber]);
  const total = useMemo(() => Math.max(Number(totalPages ?? 1) || 1, 1), [totalPages]);

  // CUSTOM HOOKS
  const drawing = useSkiaDrawing(currentPageId);
  const textManager = usePageText(currentPageId, canvasSize.width, canvasSize.height);
  const shapeManager = usePageShapes(currentPageId, canvasSize.width, canvasSize.height);

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
            await createPage(String(journalId), String(bg));
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
      // Limpiar trazos de borrador antes de salir
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
  }, [journalId, bg, router]);

  const navigateToPage = useCallback(
    async (newPageNum: number) => {
      // Esperar a que se guarden los trazos pendientes
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
    // Esperar a que se guarden los trazos pendientes
    await drawing.waitForPendingSaves();
    
    router.replace({
      pathname: '/pageList',
      params: { journalId, color: String(bg) },
    });
  }, [router, journalId, bg, drawing]);

  const handleChangeShapeColor = useCallback(
    async (shape: any) => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
      const currentIndex = colors.indexOf(shape.color);
      const nextColor = colors[(currentIndex + 1) % colors.length];

      shapeManager.setSelectedShapeColor(nextColor);

      if (currentPageId) {
        await shapeManager.loadShapes(currentPageId);
      }
    },
    [currentPageId, shapeManager],
  );

  // CALLBACKS - GESTIÓN DE AUDIO
  const handleOpenAudioSelector = useCallback(() => {
    setIsAudioModalOpen(true);
  }, []);
  const handleAudioSelected = (audioUri: string, audioType: 'recording' | 'file') => {
    console.log('Audio seleccionado:', audioUri, audioType);
  };

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
        onPress: () => handleOpenAudioSelector(),
        disabled: isLoading,
        isActive: false,
      },
    ],
    [
      handleAddPage,
      handleDeletePage,
      handleOpenTextOptions,
      handleOpenShapeOptions,
      handleOpenDrawTools,
      handleOpenAudioSelector,
      isLoading,
      showTextOptions,
      showShapeOptions,
      showDrawTools,
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

  const TOOLBAR_BG = uiColors.background;

  // RENDER
  return (
    <SafeAreaView
      style={[S.container, { backgroundColor: TOOLBAR_BG }]}
      edges={['top', 'left', 'right']}
    >
      {/* Overlay de carga */}
      {isLoading && (
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
        <View
          style={[S.pageCard, { backgroundColor: bg }]}
          onLayout={handleCanvasLayout}
        >
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
                onChangeColor={handleChangeShapeColor}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
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

      {/* Modal de selector de audio */}
      <AudioSelector
        visible={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onAudioSelected={handleAudioSelected}
      />
    </SafeAreaView>
  );
}
