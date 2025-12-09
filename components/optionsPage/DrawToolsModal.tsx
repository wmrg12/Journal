// components/DrawToolsModal.tsx
import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { uiColors, drawColors } from '@/constants/colors';
import { DrawTool } from '@/types';
import S from '../../styles/pageViewStyles';

type DrawToolsModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedTool: DrawTool;
  onToolSelect: (tool: DrawTool) => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  eraserWidth: number;
  onEraserWidthChange: (width: number) => void;
  onStartDrawing: () => void;
  onStopDrawing?: () => void; // nuevo: terminar dibujo explícitamente
};

// Configuración de grosores
const STROKE_SIZES = [1, 2, 3, 4, 5, 6];
const ERASER_SIZES = [10, 15, 20, 30, 40, 50];

export const DrawToolsModal: React.FC<DrawToolsModalProps> = ({
  visible,
  onClose,
  selectedTool,
  onToolSelect,
  selectedColor,
  onColorSelect,
  strokeWidth,
  onStrokeWidthChange,
  eraserWidth,
  onEraserWidthChange,
  onStartDrawing,
  onStopDrawing,
}) => {
  const dotBarRef = useRef<View>(null);
  const [dotBarLayout, setDotBarLayout] = useState({ x: 0, width: 0 });

  const isEraser = selectedTool === 'eraser';
  const sizes = isEraser ? ERASER_SIZES : STROKE_SIZES;
  const currentValue = isEraser ? eraserWidth : strokeWidth;

  const currentIndex = sizes.findIndex((s) => s === currentValue);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const progress = safeIndex / (sizes.length - 1);
  const fillWidth = Math.max(0, dotBarLayout.width * progress);

  const hitTestToIndex = (pageX: number) => {
    if (!dotBarLayout.width) return;
    const localX = Math.max(0, Math.min(pageX - dotBarLayout.x, dotBarLayout.width));
    const prog = localX / dotBarLayout.width;
    const idx = Math.round(prog * (sizes.length - 1));
    const newSize = sizes[idx];
    if (isEraser) {
      onEraserWidthChange(newSize);
    } else {
      onStrokeWidthChange(newSize);
    }
  };

  const renderPreview = () => {
    if (isEraser) {
      return (
        <View style={S.previewContainer}>
          <Text style={S.previewLabel}>Vista previa del borrador</Text>
          <View style={S.previewBox}>
            <View
              style={[
                S.eraserPreview,
                {
                  width: eraserWidth,
                  height: eraserWidth,
                  borderRadius: eraserWidth / 2,
                  backgroundColor: '#FF5252',
                  opacity: 0.4,
                },
              ]}
            />
          </View>
          <Text style={S.previewSize}>{eraserWidth}px</Text>
        </View>
      );
    }

    return (
      <View style={S.previewContainer}>
        <Text style={S.previewLabel}>Vista previa del trazo</Text>
        <View style={S.previewBox}>
          <View
            style={[
              S.strokePreview,
              {
                width: 60,
                height: strokeWidth,
                backgroundColor: selectedColor,
                borderRadius: strokeWidth / 2,
              },
            ]}
          />
        </View>
        <Text style={S.previewSize}>{strokeWidth}px</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        // Si existe onStopDrawing preferimos llamarla (termina el modo dibujar).
        if (onStopDrawing) {
          onStopDrawing();
        } else {
          onClose();
        }
      }}
      statusBarTranslucent
    >
      <View style={S.drawModalOverlay}>
        <TouchableOpacity onPress={() => { onStopDrawing?.(); }}>
          <MaterialIcons name="close" size={24} color={uiColors.gray} />
        </TouchableOpacity>

        <View style={S.drawOptionsContainer}>
          <View style={S.drawOptionsHeader}>
            <View style={S.drawIconContainer}>
              <MaterialIcons name="brush" size={20} color={uiColors.black} />
            </View>
            <Text style={S.drawOptionsTitle}>Herramientas de dibujo</Text>
            <TouchableOpacity
              onPress={() => {
                if (onStopDrawing) onStopDrawing();
                else onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color={uiColors.gray} />
            </TouchableOpacity>
          </View>

          {/* Selección de herramienta */}
          <View style={S.toolsSection}>
            <Text style={S.drawSectionLabel}>Herramienta</Text>
            <View style={S.toolsRow}>
              {[
                { id: 'pencil', icon: 'edit', label: 'Lápiz' },
                { id: 'pen', icon: 'brush', label: 'Pincel' },
                { id: 'marker', icon: 'create', label: 'Marcador' },
                { id: 'eraser', icon: 'auto-fix-off', label: 'Borrador' },
              ].map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[S.toolButtonLarge, selectedTool === (tool.id as DrawTool) && S.toolButtonActive]}
                  onPress={() => onToolSelect(tool.id as DrawTool)}
                  accessibilityLabel={tool.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedTool === (tool.id as DrawTool) }}
                >
                  <MaterialIcons
                    name={tool.icon as any}
                    size={22}
                    color={selectedTool === (tool.id as DrawTool) ? uiColors.primary : uiColors.black}
                  />
                  <Text
                    style={[
                      S.toolLabelLarge,
                      selectedTool === (tool.id as DrawTool) && { color: uiColors.primary, fontWeight: '600' },
                    ]}
                  >
                    {tool.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Selector de color */}
          {!isEraser && (
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
                    onPress={() => onColorSelect(clr)}
                    accessibilityLabel={`Color ${clr}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedColor === clr }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Control de grosor */}
          <View style={S.thicknessSection}>
            <Text style={S.drawSectionLabel}>
              {isEraser ? 'Tamaño del borrador' : 'Grosor del trazo'}
            </Text>

            <View
              ref={dotBarRef}
              style={S.dotBar}
              onLayout={() => {
                dotBarRef.current?.measureInWindow((px, py, w) => {
                  const paddingH = 14;
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

              {sizes.map((size, i) => {
                const active = i === safeIndex;
                const passed = i < safeIndex;
                const dotSize = 8 + i * 2;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      if (isEraser) onEraserWidthChange(size);
                      else onStrokeWidthChange(size);
                    }}
                    activeOpacity={0.85}
                    style={S.dotTap}
                    accessibilityRole="button"
                    accessibilityLabel={`${isEraser ? 'Tamaño' : 'Grosor'} ${size}`}
                    accessibilityState={{ selected: active }}
                  >
                    <View
                      style={[
                        S.dotSelectable,
                        {
                          width: dotSize,
                          height: dotSize,
                          borderRadius: dotSize / 2,
                          backgroundColor: active || passed ? uiColors.primary : '#cfcfcf',
                          opacity: active ? 1 : passed ? 0.5 : 1,
                          transform: [{ scale: active ? 1.2 : 1 }],
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={S.sizeButtonsRow}>
              {sizes.map((size, i) => (
                <TouchableOpacity
                  key={i}
                  style={[S.sizeButton, currentValue === size && S.sizeButtonActive]}
                  onPress={() => {
                    if (isEraser) onEraserWidthChange(size);
                    else onStrokeWidthChange(size);
                  }}
                >
                  <Text style={[S.sizeButtonText, currentValue === size && S.sizeButtonTextActive]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vista previa */}
          {renderPreview()}

          {/* Botones de acción */}
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              style={S.addTextButton}
              onPress={() => {
                // Inicia modo dibujo y cierra modal para dibujar
                onStartDrawing();
                // Mantener modal abierto o cerrarlo según UX: aquí cerramos
                if (onStopDrawing) {
                  // no cerrar modal: onStartDrawing -> normalmente hará setDrawMode(true) y la UI de dibujo estará activa
                  onClose(); // cerramos modal para empezar a dibujar en pantalla
                } else {
                  onClose();
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={S.addTextButtonText}>Empezar a dibujar</Text>
            </TouchableOpacity>

            {/* Botón explícito terminar dibujo */}
            <TouchableOpacity
              style={[S.addTextButton, { marginTop: 8 }]}
              onPress={() => {
                if (onStopDrawing) onStopDrawing();
                else onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={S.addTextButtonText}>Terminar dibujo ✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DrawToolsModal;