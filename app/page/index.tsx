import React, { useEffect, useMemo, useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { pagePalette, uiColors, textColors, drawColors } from '@/constants/colors';
import { textFonts, TextFont, fontFamilyMap } from '@/constants/fonts';
import S from '../../styles/pageViewStyles';
import {
  createPage,
  deletePage,
  getTotalPages,
  getPageColor,
  getPageId,
  createPageText,
  listPageTexts,
  updatePageText,
  deletePageText,
  PageText as BasePageText,
  listPageDraws,
  createPageDraw,
} from '@/src/db/dao';

type PageText = BasePageText & {
  rotation?: number;
};

type Params = {
  journalId?: string;
  color?: string;
  pageNumber?: string;
  totalPages?: string;
};

type DrawTool = 'pencil' | 'pen' | 'marker';

type Stroke = {
  id: string;
  tool: DrawTool;
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
  _persistedPathD?: string;
};

// DraggableText

type DraggableTextProps = {
  text: PageText;
  currentPageId: string | null;
  handleDeleteText: (id: string) => void;
  getPanFor: (t: PageText) => Animated.ValueXY;
  onPositionCommit: (id: string, x: number, y: number) => void;
  locked: boolean;
  isSelected: boolean;
  onToggleLock: (id: string) => void;
  onSelect: (id: string) => void;
  onEdit: (t: PageText) => void;
};

const DraggableTextBase = ({
  text,
  currentPageId,
  handleDeleteText,
  getPanFor,
  onPositionCommit,
  locked,
  isSelected,
  onToggleLock,
  onSelect,
  onEdit,
}: DraggableTextProps) => {
  // pan estable por id
  const pan = useMemo(() => getPanFor(text), [getPanFor, text]);
  const [isDragging, setIsDragging] = useState(false);
  const toolbarButtonPressed = useRef(false);
  const startRef = useRef({ x: text.position_x, y: text.position_y });
  const [rotation, setRotation] = useState(text.rotation ?? 0);
  const rotationStartRef = useRef(rotation);
  const rotationRef = useRef(rotation);
  const [rotateMode] = useState(false);
  const lockedRef = useRef(locked);
  const textBoxRef = useRef<View>(null);
  const textCenterRef = useRef({ x: 0, y: 0 });
  const initialAngleRef = useRef(0);
  const [fontSize, setFontSize] = useState(text.font_size ?? 16);
  const fontSizeRef = useRef(fontSize);
  const fontSizeStartRef = useRef(fontSize);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartYRef = useRef(0);

  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    if (typeof text.font_size === 'number') {
      setFontSize(text.font_size);
      fontSizeRef.current = text.font_size;
    }
  }, [text.font_size]);

  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);

  // Sync si la BD movió el texto (sin animación)
  useEffect(() => {
    const vx = (pan.x as any)._value;
    const vy = (pan.y as any)._value;
    const dx = Math.abs(vx - text.position_x);
    const dy = Math.abs(vy - text.position_y);
    if (!isDragging && (dx > 0.5 || dy > 0.5)) {
      pan.setValue({ x: text.position_x, y: text.position_y });
      startRef.current = { x: text.position_x, y: text.position_y };
    }
  }, [text.position_x, text.position_y, pan, isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !toolbarButtonPressed.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !toolbarButtonPressed.current &&
        !lockedRef.current &&
        (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderGrant: () => {
        if (toolbarButtonPressed.current) return;

        onSelect(text.id);

        if (!lockedRef.current) {
          setIsDragging(true);
          startRef.current = {
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          };
          rotationStartRef.current = rotation;
          if (!lockedRef.current && !rotateMode) {
            setIsDragging(true);
          }
        }
      },
      onPanResponderMove: (_, g) => {
        if (lockedRef.current) return;
        if (rotateMode) {
          const delta = g.dx;
          setRotation(rotationStartRef.current + delta);
        } else {
          const nx = startRef.current.x + g.dx;
          const ny = startRef.current.y + g.dy;
          pan.setValue({ x: nx, y: ny });
        }
      },
      onPanResponderRelease: async () => {
        if (toolbarButtonPressed.current) {
          toolbarButtonPressed.current = false;
          return;
        }
        setIsDragging(false);

        if (lockedRef.current) return;

        const newX = (pan.x as any)._value;
        const newY = (pan.y as any)._value;

        onPositionCommit(text.id, newX, newY);
        if (currentPageId) {
          try {
            await updatePageText(text.id, {
              position_x: newX,
              position_y: newY,
            });
          } catch (e) {
            console.error('Error updating text position:', e);
          }
        }
      },
    }),
  ).current;

  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,

      onPanResponderGrant: (evt) => {
        toolbarButtonPressed.current = true;
        rotationStartRef.current = rotationRef.current;

        textBoxRef.current?.measureInWindow((x, y, width, height) => {
          textCenterRef.current = {
            x: x + width / 2,
            y: y + height / 2,
          };

          const { pageX, pageY } = evt.nativeEvent;
          const dx = pageX - textCenterRef.current.x;
          const dy = pageY - textCenterRef.current.y;
          initialAngleRef.current = Math.atan2(dy, dx) * (180 / Math.PI);
        });
      },

      onPanResponderMove: (evt) => {
        if (lockedRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const dx = pageX - textCenterRef.current.x;
        const dy = pageY - textCenterRef.current.y;
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const angleDelta = currentAngle - initialAngleRef.current;
        setRotation(rotationStartRef.current + angleDelta);
      },

      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        if (lockedRef.current) return;

        if (currentPageId) {
          try {
            await updatePageText(text.id, {
              rotation: rotationRef.current,
            });
          } catch (e) {
            console.error('Error updating text rotation:', e);
          }
        }
      },
    }),
  ).current;

  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockedRef.current,
      onMoveShouldSetPanResponder: () => !lockedRef.current,
      onPanResponderGrant: (evt) => {
        if (lockedRef.current) return;
        toolbarButtonPressed.current = true;
        setIsResizing(true);

        fontSizeStartRef.current = fontSizeRef.current;
        resizeStartYRef.current = evt.nativeEvent.pageY;
      },
      onPanResponderMove: (evt) => {
        if (lockedRef.current) return;

        const deltaY = resizeStartYRef.current - evt.nativeEvent.pageY; // subir = más grande
        const nextSize = Math.max(8, Math.min(72, fontSizeStartRef.current + deltaY / 4));
        setFontSize(nextSize);
      },
      onPanResponderRelease: async () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);

        if (lockedRef.current || !currentPageId) return;

        try {
          await updatePageText(text.id, { font_size: fontSizeRef.current });
        } catch (e) {
          console.error('Error updating font size:', e);
        }
      },
      onPanResponderTerminate: () => {
        toolbarButtonPressed.current = false;
        setIsResizing(false);
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        S.textContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate: `${rotation}deg` }],
          opacity: isDragging ? 0.7 : 1,
          zIndex: isSelected ? 1000 : 1,
        },
      ]}
    >
      {/* Contenedor rotar */}
      <Animated.View
        style={{
          transform: [{ rotate: `${rotation}deg` }],
        }}
      ></Animated.View>
      {/* Toolbar tipo Canva */}
      {isSelected && (
        <View style={S.textToolbar}>
          <TouchableOpacity
            onPressIn={() => {
              toolbarButtonPressed.current = true;
            }}
            onPress={() => {
              onToggleLock(text.id);
              toolbarButtonPressed.current = false;
            }}
            style={S.textToolbarButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name={locked ? 'lock' : 'lock-open'} size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={() => {
              toolbarButtonPressed.current = true;
            }}
            onPress={() => {
              if (lockedRef.current) {
                toolbarButtonPressed.current = false;
                return;
              }
              onSelect(text.id);
              onEdit(text);
              toolbarButtonPressed.current = false;
            }}
            style={[S.textToolbarButton, locked && { opacity: 0.4 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="edit" size={14} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPressIn={() => {
              toolbarButtonPressed.current = true;
            }}
            onPress={() => {
              handleDeleteText(text.id);
              toolbarButtonPressed.current = false;
            }}
            style={[S.textToolbarButton, S.textToolbarDelete]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="delete" size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Rotar */}
      {isSelected && !locked && (
        <View {...rotatePanResponder.panHandlers} style={S.rotateButton}>
          <MaterialIcons name="rotate-right" size={16} color="#fff" />
        </View>
      )}

      {/* Handle para cambiar tamaño */}
      {isSelected && !locked && (
        <View {...resizePanResponder.panHandlers} style={S.resizeHandle} pointerEvents="auto">
          <View
            style={[S.resizeHandleInner, isResizing && { backgroundColor: uiColors.primary }]}
          />
        </View>
      )}

      {/* Recuadro del texto */}
      <View
        ref={textBoxRef}
        style={[S.textBox, isSelected && S.textBoxSelected, locked && S.textBoxLocked]}
      >
        <Text
          style={[
            S.textContent,
            {
              fontFamily: fontFamilyMap[text.font_family as TextFont] ?? text.font_family,
              color: text.color,
              fontSize: fontSize,
            },
          ]}
        >
          {text.content}
        </Text>
      </View>
      {/* Handle para cambiar tamaño fuera de la rotación */}
      {isSelected && !locked && (
        <View {...resizePanResponder.panHandlers} style={S.resizeHandle} pointerEvents="auto">
          <View
            style={[S.resizeHandleInner, isResizing && { backgroundColor: uiColors.primary }]}
          />
        </View>
      )}
    </Animated.View>
  );
};

const DraggableText = memo(DraggableTextBase);

// PageView
export default function PageView() {
  const { journalId, color, pageNumber, totalPages } = useLocalSearchParams<Params>();
  const router = useRouter();

  const [bg, setBg] = useState<(typeof pagePalette)[number]>(pagePalette[0]);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedTool, setSelectedTool] = useState<DrawTool>('pencil');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // Dibujo

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  // Convertir puntos -> path "d"
  const pointsToPath = useCallback((pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    const [p0, ...rest] = pts;
    return `M ${p0.x} ${p0.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(' ');
  }, []);

  // Presets por herramienta (usa tu slider como base 1..6)
  const getToolStyle = useCallback(
    (tool: DrawTool) => {
      const base = strokeWidth; // 1..6
      switch (tool) {
        case 'pencil': // delgado, casi opaco
          return { width: Math.max(1, base), opacity: 0.95 };
        case 'marker': // grueso y translúcido
          return { width: Math.max(6, base * 3), opacity: 0.5 };
        case 'pen': // pincel con grosor variable
          return { width: Math.max(2, base * 2), opacity: 0.9 };
        default:
          return { width: base, opacity: 1 };
      }
    },
    [strokeWidth],
  );

  // Gestos de dibujo sobre el canvas
  const onDrawStart = useCallback(
    (x: number, y: number) => {
      const { width, opacity } = getToolStyle(selectedTool);
      const s: Stroke = {
        id: String(Date.now()) + Math.random().toString(36).slice(2),
        tool: selectedTool,
        color: selectedColor,
        width,
        opacity,
        points: [{ x, y }],
      };
      setCurrentStroke(s);
    },
    [getToolStyle, selectedTool, selectedColor],
  );

  const onDrawMove = useCallback((x: number, y: number) => {
    setCurrentStroke((prev) => {
      if (!prev) return prev;
      const last = prev.points[prev.points.length - 1];
      const dx = x - last.x,
        dy = y - last.y;
      if (dx * dx + dy * dy < 1.5) return prev; // umbral para no saturar puntos
      return { ...prev, points: [...prev.points, { x, y }] };
    });
  }, []);

  const onDrawEnd = useCallback(() => {
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length < 2) return null;
      setStrokes((s) => [...s, prev]);
      // guardar en BD
      try {
        if (currentPageId && typeof createPageDraw === 'function') {
          const pathD = pointsToPath(prev.points);
          // @ts-ignore: solo si existe en tu DAO
          createPageDraw(currentPageId, pathD, prev.color, prev.width, prev.opacity, prev.tool);
        }
      } catch (e) {
        console.error('No se pudo guardar el trazo', e);
      }
      return null;
    });
  }, [currentPageId, pointsToPath]);

  const [showTextOptions, setShowTextOptions] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState<(typeof textColors)[number]>(
    textColors[0],
  );
  const [selectedFont, setSelectedFont] = useState<TextFont>(textFonts[0]);
  const [textInput, setTextInput] = useState('');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [lockedTextIds, setLockedTextIds] = useState<Record<string, boolean>>({});
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Estado para textos en la página
  const [pageTexts, setPageTexts] = useState<PageText[]>([]);

  // Mantener Animated.ValueXY por id
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

  const pageNum = useMemo(() => Math.max(Number(pageNumber ?? 1) || 1, 1), [pageNumber]);
  const total = useMemo(() => Math.max(Number(totalPages ?? 1) || 1, 1), [totalPages]);
  const SEGMENTS = 6;
  const paddingH = 14;
  const dotBarRef = useRef<View>(null);
  const [dotBarLayout, setDotBarLayout] = useState({ x: 0, width: 0 });
  const progress = (strokeWidth - 1) / (SEGMENTS - 1);
  const fillWidth = Math.max(0, dotBarLayout.width * progress);

  const hitTestToIndex = (pageX: number) => {
    if (!dotBarLayout.width) return;
    const localX = Math.max(0, Math.min(pageX - dotBarLayout.x, dotBarLayout.width));
    const prog = localX / dotBarLayout.width;
    const idx = Math.round(prog * (SEGMENTS - 1)) + 1;
    setStrokeWidth(idx);
  };

  // Cargar color desde parámetro
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

  // Cargar color desde DB
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
          if (found) setBg(found as (typeof pagePalette)[number]);
        }
      } catch (error) {
        console.error('Error loading page color:', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [journalId, pageNum]);

  // Cargar ID de página y textos
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
          // Asegura ORDER BY en listPageTexts
          const texts = await listPageTexts(pageId);
          if (mounted) setPageTexts((prev) => mergeById(prev, texts));

          const lockedState: Record<string, boolean> = {};
          texts.forEach((text) => {
            if (text.is_locked) {
              lockedState[text.id] = true;
            }
          });
          setLockedTextIds(lockedState);

          try {
            const draws = await listPageDraws(pageId);
            if (mounted) {
              setStrokes(
                draws.map((d) => ({
                  id: d.id,
                  tool: d.tool as DrawTool,
                  color: d.color,
                  width: d.width,
                  opacity: d.opacity,
                  points: [],
                  _persistedPathD: d.path_d,
                })),
              );
            }
          } catch (e) {
            console.error('Error loading page draws:', e);
            if (mounted) setStrokes([]); // fallback limpio
          }
        } else if (mounted) {
          setCurrentPageId(null);
          setPageTexts([]);
          setStrokes([]);
          setLockedTextIds({});
        }
      } catch (error) {
        console.error('Error loading page texts:', error);
        if (mounted) {
          setPageTexts([]);
          setStrokes([]);
          setLockedTextIds({});
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [journalId, pageNum, bg, mergeById]);

  // Validar total de páginas
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

  const handleSelectTool = useCallback((tool: DrawTool) => {
    setSelectedTool(tool);
  }, []);

  //commit
  const commitTextPosition = useCallback((id: string, x: number, y: number) => {
    setPageTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t)),
    );
  }, []);

  const handleConfirmText = useCallback(async () => {
    const trimmed = textInput.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Escribe algo primero');
      return;
    }
    if (!currentPageId) {
      Alert.alert('Error', 'No se pudo identificar la página');
      return;
    }

    setIsLoading(true);
    try {
      if (!editingTextId) {
        // crear
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
        // editar
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
      setShowTextOptions(false);
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Error',
        editingTextId ? 'No se pudo actualizar el texto.' : 'No se pudo añadir el texto.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [textInput, selectedTextColor, selectedFont, currentPageId, mergeById, editingTextId]);

  // Eliminar texto (optimista + limpiar pan)
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

            setIsLoading(true);
            try {
              await deletePageText(textId);
              const latest = await listPageTexts(currentPageId);
              setPageTexts((prev) => mergeById(prev, latest));
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo eliminar el texto.');
              const latest = await listPageTexts(currentPageId);
              setPageTexts(latest);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]);
    },
    [currentPageId, mergeById],
  );

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
    setDrawMode(false);
    setEditingTextId(t.id);
    setSelectedTextId(t.id);
    setTextInput(t.content);
    setSelectedFont(t.font_family as TextFont);
    setSelectedTextColor(t.color as (typeof textColors)[number]);

    setShowTextOptions(true);
  }, []);

  const navigateToPage = useCallback(
    (newPageNum: number) => {
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
    [journalId, bg, total, router],
  );

  // Toolbar items
  const toolbarItems = useMemo(
    () => [
      {
        id: 'delete',
        icon: 'delete-outline' as const,
        label: 'Eliminar',
        onPress: handleDeletePage,
        disabled: isLoading,
      },
      {
        id: 'add',
        icon: 'add' as const,
        label: 'Nueva',
        onPress: handleAddPage,
        disabled: isLoading,
      },
      {
        id: 'text',
        icon: 'text-fields' as const,
        label: 'Texto',
        onPress: () => {
          setDrawMode(false);
          setEditingTextId(null);
          setTextInput('');
          setShowTextOptions(true);
        },

        disabled: isLoading,
      },
      {
        id: 'draw',
        icon: 'edit' as const,
        label: 'Dibujar',
        onPress: () => setShowDrawTools(true),
        disabled: isLoading,
      },
      {
        id: 'undo',
        icon: 'undo' as const,
        label: 'Deshacer',
        onPress: () => {},
        disabled: true,
      },
      {
        id: 'redo',
        icon: 'redo' as const,
        label: 'Rehacer',
        onPress: () => {},
        disabled: true,
      },
    ],
    [handleAddPage, handleDeletePage, isLoading],
  );

  return (
    <SafeAreaView style={[S.container, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      {isLoading && (
        <View style={S.loadingOverlay}>
          <ActivityIndicator size="large" color={uiColors.danger} />
        </View>
      )}

      {/* Header */}
      <View style={S.header}>
        <View style={S.leftGroup}>
          {pageNum > 1 && (
            <TouchableOpacity
              onPress={() => navigateToPage(pageNum - 1)}
              style={S.navButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
              disabled={isLoading}
              accessibilityLabel="Página anterior"
              accessibilityRole="button"
            >
              <MaterialIcons
                name="arrow-back-ios"
                size={22}
                color={isLoading ? '#ccc' : uiColors.danger}
              />
            </TouchableOpacity>
          )}
          {pageNum < total && (
            <TouchableOpacity
              onPress={() => navigateToPage(pageNum + 1)}
              style={S.navButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
              disabled={isLoading}
              accessibilityLabel="Página siguiente"
              accessibilityRole="button"
            >
              <MaterialIcons
                name="arrow-forward-ios"
                size={22}
                color={isLoading ? '#ccc' : uiColors.danger}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={S.titleWrap} pointerEvents="none">
          <Text style={S.title}>{`Pag ${pageNum}`}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            router.replace({
              pathname: '/pageList',
              params: { journalId, color: String(bg) },
            });
          }}
          style={S.checkButton}
          accessibilityLabel="Hecho"
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
          disabled={isLoading}
        >
          <MaterialIcons name="check" size={22} color={isLoading ? '#ccc' : uiColors.danger} />
        </TouchableOpacity>
      </View>

      {/* Canvas con textos arrastrables */}
      {/* Canvas con dibujo + textos */}
      <View
        style={S.canvas}
        onStartShouldSetResponder={() => drawMode}
        onMoveShouldSetResponder={() => drawMode}
        onResponderGrant={(e) => {
          if (!drawMode) return;
          const { locationX, locationY } = e.nativeEvent;
          onDrawStart(locationX, locationY);
        }}
        onResponderMove={(e) => {
          if (!drawMode) return;
          const { locationX, locationY } = e.nativeEvent;
          onDrawMove(locationX, locationY);
        }}
        onResponderRelease={() => {
          if (!drawMode) return;
          onDrawEnd();
        }}
        onResponderTerminate={() => {
          if (!drawMode) return;
          onDrawEnd();
        }}
      >
        <Svg style={{ position: 'absolute', inset: 0 }}>
          {strokes.map((s) => (
            <Path
              key={s.id}
              d={s._persistedPathD ?? pointsToPath(s.points)}
              stroke={s.color}
              strokeWidth={s.width}
              strokeOpacity={s.opacity}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentStroke && (
            <Path
              d={pointsToPath(currentStroke.points)}
              stroke={currentStroke.color}
              strokeWidth={currentStroke.width}
              strokeOpacity={currentStroke.opacity}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>

        {/* Deseleccionar texto */}
        {!drawMode && (
          <TouchableOpacity
            style={{ position: 'absolute', inset: 0 }}
            activeOpacity={1}
            onPress={() => setSelectedTextId(null)}
          />
        )}
        {/* Textos arrastrables encima del fondo */}
        <View
          style={{ position: 'absolute', inset: 0 }}
          pointerEvents={drawMode ? 'none' : 'box-none'}
        ></View>

        {/* 2) Textos arrastrables encima */}
        <View pointerEvents={drawMode ? 'none' : 'auto'}>
          {pageTexts
            .sort((a, b) => {
              if (a.id === selectedTextId) return 1;
              if (b.id === selectedTextId) return -1;
              return 0;
            })
            .map((text) => (
              <DraggableText
                key={text.id}
                text={text}
                currentPageId={currentPageId}
                handleDeleteText={handleDeleteText}
                getPanFor={getPanFor}
                onPositionCommit={commitTextPosition}
                locked={!!lockedTextIds[text.id]}
                isSelected={selectedTextId === text.id}
                onToggleLock={handleToggleLock}
                onSelect={handleSelectText}
                onEdit={handleEditTextRequest}
              />
            ))}
        </View>
      </View>

      {/* Toolbar horizontal con scroll */}
      <View pointerEvents="box-none" style={S.toolbarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.toolbarBar}
        >
          {toolbarItems.map((it) => (
            <TouchableOpacity
              key={it.id}
              onPress={it.onPress}
              activeOpacity={0.7}
              disabled={it.disabled}
              style={[
                S.toolItem,
                it.disabled && S.toolItemDisabled,
                (it.id === 'text' && showTextOptions) || (it.id === 'draw' && showDrawTools)
                  ? { backgroundColor: uiColors.grayO }
                  : null,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={it.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: it.disabled }}
            >
              <MaterialIcons
                name={it.icon}
                size={22}
                color={it.disabled ? '#aaa' : '#333'}
                style={S.toolItemIcon}
              />
              <Text style={[S.toolItemLabel, it.disabled && S.toolItemLabelDisabled]}>
                {it.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal opciones de texto */}
      <Modal
        visible={showTextOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTextOptions(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={S.textModalOverlay}>
            <TouchableOpacity
              style={S.textModalBackground}
              activeOpacity={1}
              onPress={() => setShowTextOptions(false)}
            />
            <View style={S.textOptionsContainer}>
              <View style={S.textOptionsHeader}>
                <View style={S.textIconContainer}>
                  <Text style={S.textIconLetter}>T</Text>
                </View>
                <Text style={S.textOptionsTitle}>Escribir texto</Text>
              </View>

              <TextInput
                style={S.textInput}
                placeholder="Escribe aquí..."
                value={textInput}
                onChangeText={setTextInput}
                multiline
                autoFocus
                accessibilityLabel="Campo de texto"
              />

              {/* Colores texto */}
              <View style={S.colorSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  {textColors.map((colorOption) => (
                    <TouchableOpacity
                      key={colorOption}
                      onPress={() => setSelectedTextColor(colorOption)}
                      style={[
                        S.colorCircle,
                        { backgroundColor: colorOption },
                        selectedTextColor === colorOption && S.colorCircleSelected,
                      ]}
                      accessibilityLabel={`Color ${colorOption}`}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: selectedTextColor === colorOption,
                      }}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Fuentes */}
              <View style={S.fontSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                >
                  {textFonts.map((font) => (
                    <TouchableOpacity
                      key={font}
                      onPress={() => setSelectedFont(font)}
                      style={[S.fontButton, selectedFont === font && S.fontButtonSelected]}
                      accessibilityLabel={`Fuente ${font}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedFont === font }}
                    >
                      <Text
                        style={[
                          S.fontButtonText,
                          { fontFamily: fontFamilyMap[font] ?? font },
                          selectedFont === font && S.fontButtonTextSelected,
                        ]}
                      >
                        {font}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={S.addTextButton}
                onPress={handleConfirmText}
                activeOpacity={0.7}
              >
                <Text style={S.addTextButtonText}>
                  {editingTextId ? 'Guardar cambios' : 'Añadir texto'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal herramientas de dibujo */}
      <Modal
        visible={showDrawTools}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDrawTools(false)}
        statusBarTranslucent
      >
        <View style={S.drawModalOverlay}>
          <TouchableOpacity
            style={S.drawModalBackground}
            activeOpacity={1}
            onPress={() => setShowDrawTools(false)}
          />
          <View style={S.drawOptionsContainer}>
            <View style={S.drawOptionsHeader}>
              <View style={S.drawIconContainer}>
                <MaterialIcons name="brush" size={20} color={uiColors.black} />
              </View>
              <Text style={S.drawOptionsTitle}>Herramientas de dibujo</Text>
            </View>

            {/* Herramientas */}
            <View style={S.toolsSection}>
              <Text style={S.drawSectionLabel}>Herramienta</Text>
              <View style={S.toolsRow}>
                {[
                  { id: 'pencil', icon: 'edit', label: 'Lápiz' },
                  { id: 'pen', icon: 'brush', label: 'Pincel' },
                  { id: 'marker', icon: 'create', label: 'Marcador' },
                ].map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={[S.toolButtonLarge, selectedTool === tool.id && S.toolButtonActive]}
                    onPress={() => handleSelectTool(tool.id as any)}
                    accessibilityLabel={tool.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedTool === tool.id }}
                  >
                    <MaterialIcons name={tool.icon as any} size={22} color={uiColors.black} />
                    <Text style={S.toolLabelLarge}>{tool.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Colores */}
            <View style={S.colorSectionDraw}>
              <Text style={S.drawSectionLabel}>Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
              >
                {drawColors.map((clr) => (
                  <TouchableOpacity
                    key={clr}
                    style={[
                      S.colorCircleLarge,
                      { backgroundColor: clr },
                      selectedColor === clr && S.colorCircleSelected,
                    ]}
                    onPress={() => setSelectedColor(clr)}
                    accessibilityLabel={`Color ${clr}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedColor === clr }}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Grosor del trazo */}
            <View style={S.thicknessSection}>
              <Text style={S.drawSectionLabel}>Grosor del trazo</Text>

              <View
                ref={dotBarRef}
                style={S.dotBar}
                onLayout={() => {
                  dotBarRef.current?.measureInWindow((px, py, w) => {
                    setDotBarLayout({
                      x: px + paddingH,
                      width: w - paddingH * 2,
                    });
                  });
                }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={(e) => hitTestToIndex(e.nativeEvent.pageX)}
                onResponderMove={(e) => hitTestToIndex(e.nativeEvent.pageX)}
              >
                <View style={S.dotBarTrack} />
                <View style={[S.dotBarFill, { width: fillWidth }]} />
                {Array.from({ length: SEGMENTS }).map((_, i) => {
                  const idx = i + 1;
                  const active = idx === strokeWidth;
                  const passed = idx < strokeWidth;
                  const size = 6 + i * 3;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setStrokeWidth(idx)}
                      activeOpacity={0.85}
                      style={S.dotTap}
                      accessibilityRole="button"
                      accessibilityLabel={`Grosor ${idx}`}
                      accessibilityState={{ selected: active }}
                    >
                      <View
                        style={[
                          S.dotSelectable,
                          {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            backgroundColor: active || passed ? uiColors.primary : '#cfcfcf',
                            opacity: active ? 1 : passed ? 0.45 : 1,
                            transform: [{ scale: active ? 1.1 : 1 }],
                          },
                        ]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity
              style={[S.addTextButton, { marginTop: 12 }]}
              onPress={() => {
                setShowDrawTools(false); // cerrar modal
                setDrawMode(true); // activar modo de dibujo
              }}
              activeOpacity={0.7}
            >
              <Text style={S.addTextButtonText}>Empezar a dibujar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
