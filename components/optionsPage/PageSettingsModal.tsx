// components/optionsPage/PageSettingsModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { pagePalette, uiColors } from '@/constants/colors';
import S from '@/styles/pageViewStyles';
import {
  PagePattern,
  PAGE_PATTERNS,
  PagePatternBackground,
} from '@/components/optionsCreatePage/PagePatterns';

type ColorScope = 'current' | 'all';

type PageSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  currentColor: string;
  currentPattern: PagePattern;
  onSave: (color: string, pattern: PagePattern, colorScope: ColorScope) => void;
};

export const PageSettingsModal: React.FC<PageSettingsModalProps> = ({
  visible,
  onClose,
  currentColor,
  currentPattern,
  onSave,
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedPattern, setSelectedPattern] = useState<PagePattern>(currentPattern);
  const [colorScope, setColorScope] = useState<ColorScope>('current');

  const handleSave = () => {
    onSave(selectedColor, selectedPattern, colorScope);
    onClose();
  };

  React.useEffect(() => {
    if (visible) {
      setSelectedColor(currentColor);
      setSelectedPattern(currentPattern);
      setColorScope('current');
    }
  }, [visible, currentColor, currentPattern]);

  const colorChanged = selectedColor !== currentColor;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={S.overlay} onPress={onClose}>
        <Pressable style={S.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* HEADER */}
          <View style={S.audioOptionsHeader}>
            <View style={S.shapeIconContainer}>
              <MaterialIcons name="palette" size={18} color={uiColors.black} />
            </View>
            <Text style={S.audioOptionsTitle}>Personalizar Página</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={uiColors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sección de Color */}
            <View style={S.section}>
              <Text style={S.colorSectionLabel}>Color de fondo</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={S.colorScrollWrapper}
              >
                <View style={S.colorScrollContent}>
                  {pagePalette.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        S.shapeColorCircleLarge,
                        { backgroundColor: color },
                        selectedColor === color && S.shapeColorCircleSelected,
                      ]}
                    />
                  ))}
                </View>
              </ScrollView>

              {/* Radio buttons para alcance del color */}
              {colorChanged && (
                <View style={S.scopeContainer}>
                  <Text style={S.scopeLabel}>Aplicar color a:</Text>

                  <TouchableOpacity
                    style={S.radioOption}
                    onPress={() => setColorScope('current')}
                    activeOpacity={0.7}
                  >
                    <View style={S.radioCircle}>
                      {colorScope === 'current' && <View style={S.radioSelected} />}
                    </View>
                    <Text style={S.radioLabel}>Solo esta página</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={S.radioOption}
                    onPress={() => setColorScope('all')}
                    activeOpacity={0.7}
                  >
                    <View style={S.radioCircle}>
                      {colorScope === 'all' && <View style={S.radioSelected} />}
                    </View>
                    <Text style={S.radioLabel}>Todas las páginas del diario</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Sección de Patrón */}
            <View style={S.section}>
              <Text style={S.sectionLabel}>Patrón</Text>
              <Text style={S.patternNote}>El patrón solo se aplica a esta página</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={S.patternScrollContent}
                style={S.patternScrollWrapper}
              >
                {PAGE_PATTERNS.map((pattern) => (
                  <TouchableOpacity
                    key={pattern}
                    style={[
                      S.patternOption,
                      selectedPattern === pattern && S.patternOptionSelected,
                    ]}
                    onPress={() => setSelectedPattern(pattern)}
                  >
                    {pattern === 'none' ? (
                      <View style={S.patternOptionContent}>
                        <MaterialIcons name="block" size={28} color={uiColors.gray} />
                      </View>
                    ) : (
                      <View style={S.patternPreviewWrapper}>
                        <PagePatternBackground
                          pattern={pattern}
                          width={56}
                          height={56}
                          color="#6B7280"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View />
            </View>

            {/* Botón Aplicar */}
            <TouchableOpacity style={S.saveButton} onPress={handleSave}>
              <Text style={S.saveButtonText}>Aplicar Cambios</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
