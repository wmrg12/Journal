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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { pagePalette, uiColors, textColors, drawColors } from '@/constants/colors';
import { textFonts, TextFont } from '@/constants/fonts';
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
  PageText,
} from '@/src/db/dao';

type Params = {
  journalId?: string;
  color?: string;
  pageNumber?: string;
  totalPages?: string;
};

type DrawTool = 'pencil' | 'pen' | 'marker';

// DraggableText

type DraggableTextProps = {
  text: PageText;
  currentPageId: string | null;
  handleDeleteText: (id: string) => void;
  getPanFor: (t: PageText) => Animated.ValueXY;
  onPositionCommit: (id: string, x: number, y: number) => void;
};

const DraggableTextBase = ({
  text,
  currentPageId,
  handleDeleteText,
  getPanFor,
  onPositionCommit,
}: DraggableTextProps) => {
  // pan estable por id
  const pan = useMemo(() => getPanFor(text), [getPanFor, text]);
  const [isDragging, setIsDragging] = useState(false);
  const deleteButtonPressed = useRef(false);
  const startRef = useRef({ x: text.position_x, y: text.position_y });

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
      onStartShouldSetPanResponder: () => !deleteButtonPressed.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !deleteButtonPressed.current && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderGrant: () => {
        if (deleteButtonPressed.current) return;
        setIsDragging(true);
        startRef.current = { x: (pan.x as any)._value, y: (pan.y as any)._value };
      },
      onPanResponderMove: (_, g) => {
        const nx = startRef.current.x + g.dx;
        const ny = startRef.current.y + g.dy;
        pan.setValue({ x: nx, y: ny });
      },
      onPanResponderRelease: async () => {
        if (deleteButtonPressed.current) {
          deleteButtonPressed.current = false;
          return;
        }
        setIsDragging(false);
        const newX = (pan.x as any)._value;
        const newY = (pan.y as any)._value;

        onPositionCommit(text.id, newX, newY);
        if (currentPageId) {
          try {
            await updatePageText(text.id, { position_x: newX, position_y: newY });
          } catch (e) {
            console.error('Error updating text position:', e);
          }
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        S.textContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          opacity: isDragging ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={[
          S.textContent,
          {
            fontFamily: text.font_family,
            color: text.color,
            fontSize: text.font_size,
          },
        ]}
      >
        {text.content}
      </Text>
      <TouchableOpacity
        onPressIn={() => {
          deleteButtonPressed.current = true;
        }}
        onPress={() => {
          handleDeleteText(text.id);
          deleteButtonPressed.current = false;
        }}
        style={S.textDeleteButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="close" size={16} color={uiColors.white} />
      </TouchableOpacity>
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

  const [showTextOptions, setShowTextOptions] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState<(typeof textColors)[number]>(
    textColors[0],
  );
  const [selectedFont, setSelectedFont] = useState<TextFont>(textFonts[0]);
  const [textInput, setTextInput] = useState('');

  // Estado para textos en la página
  const [pageTexts, setPageTexts] = useState<PageText[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

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
        } else if (mounted) {
          setCurrentPageId(null);
          setPageTexts([]);
        }
      } catch (error) {
        console.error('Error loading page texts:', error);
        if (mounted) setPageTexts([]);
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

  // Añadir texto (merge para no remountar existentes)
  const handleAddText = useCallback(async () => {
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
      const posX = 100;
      const posY = 150;

      await createPageText(currentPageId, trimmed, selectedFont, selectedTextColor, posX, posY, 16);

      const latest = await listPageTexts(currentPageId);
      setPageTexts((prev) => mergeById(prev, latest));

      setTextInput('');
      setShowTextOptions(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo añadir el texto.');
    } finally {
      setIsLoading(false);
    }
  }, [textInput, selectedTextColor, selectedFont, currentPageId, mergeById]);

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
        onPress: () => setShowTextOptions(true),
        disabled: isLoading,
      },
      {
        id: 'draw',
        icon: 'edit' as const,
        label: 'Dibujar',
        onPress: () => setShowDrawTools(true),
        disabled: isLoading,
      },
      { id: 'undo', icon: 'undo' as const, label: 'Deshacer', onPress: () => {}, disabled: true },
      { id: 'redo', icon: 'redo' as const, label: 'Rehacer', onPress: () => {}, disabled: true },
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
            router.replace({ pathname: '/pageList', params: { journalId, color: String(bg) } });
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
      <View style={S.canvas}>
        {pageTexts.map((text) => (
          <DraggableText
            key={text.id}
            text={text}
            currentPageId={currentPageId}
            handleDeleteText={handleDeleteText}
            getPanFor={getPanFor}
            onPositionCommit={commitTextPosition}
          />
        ))}
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
                      accessibilityState={{ selected: selectedTextColor === colorOption }}
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
                          { fontFamily: font },
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
                onPress={handleAddText}
                activeOpacity={0.7}
                accessibilityLabel="Añadir texto"
                accessibilityRole="button"
              >
                <Text style={S.addTextButtonText}>Añadir texto</Text>
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
                    setDotBarLayout({ x: px + paddingH, width: w - paddingH * 2 });
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
