import ColorPalette from '@/components/ColorPalette';
import { pagePalette, uiColors } from '@/constants/colors';
import { createJournal, createPage, updateJournalDefaultPattern } from '@/src/db/dao';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import S from '../../styles/createPageStyles';
import {
  PagePattern,
  PAGE_PATTERNS,
  PATTERN_NAMES,
  PagePatternBackground,
} from '@/components/optionsCreatePage/PagePatterns';

type Params = { 
  journalId?: string; 
  color?: string; 
  name?: string;   
  isNew?: string;    
};

export default function CreatePageScreen() {
  const router = useRouter();
  const { journalId, color, name, isNew } = useLocalSearchParams<Params>();
  const [bgColor, setBgColor] = useState<(typeof pagePalette)[number]>(pagePalette[0]);
  const [selectedPattern, setSelectedPattern] = useState<PagePattern>('none');
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof color === 'string') {
      const found = (pagePalette as readonly string[]).find(
        (c) => c.toLowerCase() === color.toLowerCase(),
      );
      if (found) setBgColor(found as (typeof pagePalette)[number]);
    }
  }, [color]);

  const handleBack = () => {
    router.back();
  };

  // Si no hay journalId ni isNew, mostrar error
  if (!journalId && isNew !== 'true') {
    return (
      <View style={[S.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Faltan parámetros. Vuelve atrás.</Text>
      </View>
    );
  }

  async function handleCreatePage() {
    try {
      let finalJournalId = journalId;
      
      // Si es nuevo, crear el diario ahora
      if (isNew === 'true' && name) {
        const { id } = await createJournal(name, bgColor);
        finalJournalId = id;
      }
      
      if (!finalJournalId) {
        Alert.alert('Error', 'No se pudo crear el diario.');
        return;
      }
      
      const { pageNumber, total } = await createPage(
        finalJournalId, 
        bgColor, 
        selectedPattern
      );
      
      if (pageNumber === 1) {
        await updateJournalDefaultPattern(finalJournalId, selectedPattern);
      }
      
      router.push({
        pathname: '/page',
        params: {
          journalId: finalJournalId,
          color: bgColor,
          pageNumber: String(pageNumber),
          totalPages: String(total),
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo crear la página.');
    }
  }

  return (
    <SafeAreaView style={S.container} testID="create-page-screen">
      <StatusBar backgroundColor={uiColors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity
          style={S.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={uiColors.danger} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Crear Página</Text>
        <View style={S.headerSpacer} />
      </View>

      <ScrollView
        style={S.scrollView}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <Text style={S.label} testID="preview-label">
          Vista Previa
        </Text>
        <View
          style={[S.preview, { backgroundColor: bgColor }]}
          testID="preview"
          accessibilityLabel="Vista previa de la página"
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setPreviewSize({ width, height });
          }}
        >
          {/* Patrón de fondo */}
          {previewSize.width > 0 && selectedPattern !== 'none' && (
            <View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                paddingHorizontal: 20,
                paddingVertical: 30,
              }}
            >
              <PagePatternBackground
                pattern={selectedPattern}
                width={previewSize.width}
                height={previewSize.height + 5}
                color="#888888"
              />
            </View>
          )}
        </View>

        {/* Color Picker */}
        <View style={S.colorSection}>
          <Text style={S.colorLabel}>Color:</Text>
          <View style={S.colorPaletteWrapper}>
            <ColorPalette
              options={pagePalette}
              value={bgColor}
              onChange={(color) => {
                const found = (pagePalette as readonly string[]).find(
                  (c) => c.toLowerCase() === color.toLowerCase(),
                );
                if (found) setBgColor(found as (typeof pagePalette)[number]);
              }}
            />
          </View>
        </View>

        {/* Pattern Selector */}
        <View style={S.patternSection}>
          <Text style={S.patternLabel}>Patrón:</Text>
          <View style={S.patternGrid}>
            {PAGE_PATTERNS.map((pattern) => (
              <TouchableOpacity
                key={pattern}
                style={[S.patternPreview, selectedPattern === pattern && S.patternPreviewSelected]}
                onPress={() => setSelectedPattern(pattern)}
                accessibilityLabel={`Seleccionar patrón ${PATTERN_NAMES[pattern]}`}
              >
                {pattern === 'none' ? (
                  <MaterialIcons name="block" size={28} color="#9CA3AF" />
                ) : (
                  <View style={{ width: '100%', height: '100%' }}>
                    <PagePatternBackground
                      pattern={pattern}
                      width={60}
                      height={60}
                      color="#6B7280"
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity style={S.createButton} onPress={handleCreatePage}>
          <Text style={S.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}