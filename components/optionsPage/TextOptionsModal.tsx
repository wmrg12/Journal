// components/TextOptionsModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { textColors, uiColors } from '@/constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
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

const MAX_CHARACTERS = 500;

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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_CHARACTERS) {
      onTextChange(text);
    }
  };

  const remainingChars = MAX_CHARACTERS - textInput.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }} enabled={isKeyboardVisible}>
        <View style={S.textModalOverlay}>
          <TouchableOpacity style={S.textModalBackground} activeOpacity={1} onPress={handleClose} />
          <View style={S.textOptionsContainer}>
            <View style={S.textOptionsHeader}>
              <View style={S.textIconContainer}>
                <Text style={S.textIconLetter}>T</Text>
              </View>
              <Text style={S.textOptionsTitle}>Escribir texto</Text>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={uiColors.gray} />
              </TouchableOpacity>
            </View>

            <View>
              <TextInput
                style={[S.textInput]}
                placeholder="Escribe aquí..."
                placeholderTextColor={uiColors.gray}
                value={textInput}
                onChangeText={handleTextChange}
                multiline
                autoFocus
                maxLength={MAX_CHARACTERS}
                accessibilityLabel="Campo de texto"
              />
              <Text
                style={{
                  fontSize: 12,
                  color: isNearLimit ? '#FF6B6B' : uiColors.gray,
                  textAlign: 'right',
                  marginBottom: 12,
                }}
              >
                {remainingChars} caracteres restantes
              </Text>
            </View>

            <View style={S.colorSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                keyboardShouldPersistTaps="handled"
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

            <TouchableOpacity style={S.addTextButton} onPress={onConfirm} activeOpacity={0.7}>
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
