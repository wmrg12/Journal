// components/TextOptionsModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { textColors } from '@/constants/colors';
import { TextFont, fontFamilyMap, textFonts } from '@/constants/fonts';
import S from '../../styles/pageViewStyles';

type TextOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  textInput: string;
  onTextChange: (text: string) => void;
  selectedTextColor: (typeof textColors)[number];
  onColorSelect: (color: (typeof textColors)[number]) => void;
  selectedFont: TextFont;
  onFontSelect: (font: TextFont) => void;
  onConfirm: () => void;
  isEditing: boolean;
};

export const TextOptionsModal: React.FC<TextOptionsModalProps> = ({
  visible,
  onClose,
  textInput,
  onTextChange,
  selectedTextColor,
  onColorSelect,
  selectedFont,
  onFontSelect,
  onConfirm,
  isEditing,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            onPress={onClose}
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
              onChangeText={onTextChange}
              multiline
              autoFocus
              accessibilityLabel="Campo de texto"
            />

            <View style={S.colorSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
              >
                {textColors.map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption}
                    onPress={() => onColorSelect(colorOption)}
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

            <View style={S.fontSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
              >
                {textFonts.map((font) => (
                  <TouchableOpacity
                    key={font}
                    onPress={() => onFontSelect(font)}
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
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={S.addTextButtonText}>
                {isEditing ? 'Guardar cambios' : 'Añadir texto'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};