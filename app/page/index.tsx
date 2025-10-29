import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { pagePalette, uiColors, textColors, drawColors } from '@/constants/colors';
import { textFonts, TextFont } from '@/constants/fonts';
import S from '../../styles/pageViewStyles';
import { createPage, deletePage, getTotalPages, getPageColor } from '@/src/db/dao';

type Params = {
  journalId?: string;
  color?: string;
  pageNumber?: string;
  totalPages?: string;
};

type DrawTool = 'pencil' | 'pen' | 'marker';

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

  // Parse params una sola vez
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
    const progress = localX / dotBarLayout.width; // 0..1
    const idx = Math.round(progress * (SEGMENTS - 1)) + 1;
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

  const handleAddText = useCallback(() => {
    if (textInput.trim()) {
      Alert.alert('Texto añadido', `Color: ${selectedTextColor}, Font: ${selectedFont}`);
      setTextInput('');
      setShowTextOptions(false);
    }
  }, [textInput, selectedTextColor, selectedFont]);

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
      {
        id: 'undo',
        icon: 'undo' as const,
        label: 'Deshacer',
        onPress: () => {},
        disabled: true, // Implementar lógica real
      },
      {
        id: 'redo',
        icon: 'redo' as const,
        label: 'Rehacer',
        onPress: () => {},
        disabled: true, // Implementar lógica real
      },
    ],
    [handleAddPage, handleDeletePage, isLoading],
  );

  return (
    <SafeAreaView style={[S.container, { backgroundColor: bg }]} edges={['top', 'left', 'right']}>
      {/* Loading overlay */}
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

      {/* Canvas */}
      <View style={S.canvas} />

      {/* Toolbar horizontal con scroll */}
      <View pointerEvents="box-none" style={S.toolbarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.toolbarBar}
        >
          {/* Botones existentes desde toolbarItems */}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                {/* pista base */}
                <View style={S.dotBarTrack} />
                {/* pista rellena */}
                <View style={[S.dotBarFill, { width: fillWidth }]} />
                {/* puntos */}
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
