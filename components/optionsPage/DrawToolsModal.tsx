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
};

const SEGMENTS = 6;
const paddingH = 14;

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
}) => {
  const dotBarRef = useRef<View>(null);
  const [dotBarLayout, setDotBarLayout] = useState({ x: 0, width: 0 });

  const currentWidth = selectedTool === 'eraser' ? eraserWidth : strokeWidth;
  const progress = (currentWidth - 1) / (SEGMENTS - 1);
  const fillWidth = Math.max(0, dotBarLayout.width * progress);

  const hitTestToIndex = (pageX: number) => {
    if (!dotBarLayout.width) return;
    const localX = Math.max(0, Math.min(pageX - dotBarLayout.x, dotBarLayout.width));
    const prog = localX / dotBarLayout.width;
    const idx = Math.round(prog * (SEGMENTS - 1)) + 1;
    
    if (selectedTool === 'eraser') {
      onEraserWidthChange(idx);
    } else {
      onStrokeWidthChange(idx);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={S.drawModalOverlay}>
        <TouchableOpacity
          style={S.drawModalBackground}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={S.drawOptionsContainer}>
          <View style={S.drawOptionsHeader}>
            <View style={S.drawIconContainer}>
              <MaterialIcons name="brush" size={20} color={uiColors.black} />
            </View>
            <Text style={S.drawOptionsTitle}>Herramientas de dibujo</Text>
          </View>

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
                  style={[
                    S.toolButtonLarge,
                    selectedTool === tool.id && S.toolButtonActive,
                  ]}
                  onPress={() => onToolSelect(tool.id as DrawTool)}
                  accessibilityLabel={tool.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedTool === tool.id }}
                >
                  <MaterialIcons
                    name={tool.icon as any}
                    size={22}
                    color={uiColors.black}
                  />
                  <Text style={S.toolLabelLarge}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedTool !== 'eraser' && (
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

          <View style={S.thicknessSection}>
            <Text style={S.drawSectionLabel}>
              {selectedTool === 'eraser' ? 'Grosor del borrador' : 'Grosor del trazo'}
            </Text>

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
                const active = idx === currentWidth;
                const passed = idx < currentWidth;
                const size = 6 + i * 3;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      if (selectedTool === 'eraser') {
                        onEraserWidthChange(idx);
                      } else {
                        onStrokeWidthChange(idx);
                      }
                    }}
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
                          backgroundColor:
                            active || passed ? uiColors.primary : '#cfcfcf',
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
            onPress={onStartDrawing}
            activeOpacity={0.7}
          >
            <Text style={S.addTextButtonText}>Empezar a dibujar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};