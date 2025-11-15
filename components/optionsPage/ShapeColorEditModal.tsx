import { drawColors, uiColors } from '@/constants/colors';
import S from '@/styles/pageViewStyles';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

type ShapeColorEditModalProps = {
  visible: boolean;
  onClose: () => void;
  initialColor: string;
  onSaveColor: (color: string) => void;
};

export const ShapeColorEditModal: React.FC<ShapeColorEditModalProps> = ({
  visible,
  onClose,
  initialColor,
  onSaveColor,
}) => {
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    if (visible) {
      setSelectedColor(initialColor);
    }
  }, [visible, initialColor]);

  const handleSave = () => {
    onSaveColor(selectedColor);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={S.shapeModalOverlay}>
        <View style={S.shapeOptionsContainer}>
          <View style={S.shapeOptionsHeader}>
            <View style={S.shapeIconContainer}>
              <MaterialIcons name="palette" size={20} color={uiColors.black} />
            </View>
            <Text style={S.shapeOptionsTitle}>Cambiar color</Text>
          </View>

          {/* Colores */}
          <View style={S.shapeColorSection}>
            <Text style={S.shapeSectionLabel}>Selecciona un color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {drawColors.map((clr) => (
                <TouchableOpacity
                  key={clr}
                  style={[
                    S.shapeColorCircleLarge,
                    { backgroundColor: clr },
                    selectedColor === clr && S.shapeColorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(clr)}
                />
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[S.shapeAddButton, { marginTop: 12 }]}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={S.shapeAddButtonText}>Guardar color</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
