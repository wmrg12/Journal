import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { drawColors, uiColors } from '@/constants/colors';
import { ShapeType } from '@/src/db/dao';
import S from '@/styles/pageViewStyles';

type ShapeOptionsModalProps = {
  visible: boolean;
  onClose: () => void;

  selectedShapeType: ShapeType;
  onSelectShapeType: (type: ShapeType) => void;

  selectedShapeColor: string;
  onSelectShapeColor: (color: string) => void;

  onAddShape: () => void;
};

export const ShapeOptionsModal: React.FC<ShapeOptionsModalProps> = ({
  visible,
  onClose,
  selectedShapeType,
  onSelectShapeType,
  selectedShapeColor,
  onSelectShapeColor,
  onAddShape,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={S.shapeModalOverlay}>
        <TouchableOpacity style={S.shapeModalBackground} activeOpacity={1} onPress={onClose} />
        <View style={S.shapeOptionsContainer}>
          <View style={S.shapeOptionsHeader}>
            <View style={S.shapeIconContainer}>
              <MaterialIcons name="category" size={20} color={uiColors.black} />
            </View>
            <Text style={S.shapeOptionsTitle}>Formas geométricas</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color={uiColors.gray} />
            </TouchableOpacity>
          </View>

          {/* Tipo de forma */}
          <View style={S.shapeToolsSection}>
            <Text style={S.shapeSectionLabel}>Tipo de forma</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.shapeToolsRow}
            >
              {(
                [
                  { id: 'line', label: 'Línea', icon: 'remove' },
                  { id: 'arrow', label: 'Flecha', icon: 'arrow-forward' },
                  { id: 'circle', label: 'Círculo', icon: 'radio-button-unchecked' },
                  { id: 'square', label: 'Cuadrado', icon: 'crop-square' },
                  { id: 'triangle', label: 'Cuadro', icon: 'change-history' },
                  { id: 'star', label: 'Estrella', icon: 'star' },
                  { id: 'heart', label: 'Corazón', icon: 'favorite' },
                  { id: 'diamond', label: 'Rombo', icon: 'diamond' },
                  { id: 'pentagon', label: 'Pentágono', icon: 'pentagon' },
                  { id: 'sun', label: 'Sol', icon: 'wb-sunny' },
                  { id: 'bolt', label: 'Rayo', icon: 'bolt' },
                  { id: 'flower', label: 'Flor', icon: 'filter-vintage' },
                  { id: 'mountain', label: 'Montaña', icon: 'landscape' },
                ] as { id: ShapeType; label: string; icon: any }[]
              ).map((shape) => (
                <TouchableOpacity
                  key={shape.id}
                  style={[
                    S.shapeToolButtonLarge,
                    selectedShapeType === shape.id && S.shapeToolButtonActive,
                  ]}
                  onPress={() => onSelectShapeType(shape.id)}
                >
                  <MaterialIcons
                    name={shape.icon}
                    size={22}
                    color={selectedShapeType === shape.id ? uiColors.gray : uiColors.black}
                  />
                  <Text style={S.shapeToolLabelLarge}>{shape.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Colores */}
          <View style={S.shapeColorSection}>
            <Text style={S.shapeSectionLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {drawColors.map((clr) => (
                <TouchableOpacity
                  key={clr}
                  style={[
                    S.shapeColorCircleLarge,
                    { backgroundColor: clr },
                    selectedShapeColor === clr && S.shapeColorCircleSelected,
                  ]}
                  onPress={() => onSelectShapeColor(clr)}
                />
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity
            style={[S.shapeAddButton, { marginTop: 12 }]}
            onPress={onAddShape}
            activeOpacity={0.7}
          >
            <Text style={S.shapeAddButtonText}>Añadir forma</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
