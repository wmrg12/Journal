// features/diary/CrearDiario.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StatusBar, SafeAreaView } from "react-native";
import { diaryStyles as styles } from "@/app/createDiary/stylesDiary";
import { color, colorOptions } from "@/constants/colors";
import ColorPalette from "@/components/ColorPalette";

export default function CrearDiario() {
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0]);
  const [diaryName, setDiaryName] = useState<string>("");

  const handleSave = () => {
    console.log("Guardando diario:", { name: diaryName, color: selectedColor });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={color.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Diario</Text>
        <View style={{ width: 28, height: 28 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Preview */}
        <View style={styles.diaryPreview}>
          <View style={[styles.diary, { backgroundColor: selectedColor }]}>
            <View style={styles.diaryBinding} />
          </View>
        </View>

        {/* Name */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.nameInput}
            placeholder="Name"
            placeholderTextColor={color.gray}
            value={diaryName}
            onChangeText={setDiaryName}
          />
        </View>

        {/* Color picker */}
        <View style={styles.colorSection}>
          <Text style={styles.colorLabel}>Color:</Text>
          <ColorPalette
            options={colorOptions}
            value={selectedColor}
            onChange={setSelectedColor}
          />
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>

      {/*<View style={styles.bottomIndicator} />*/}
    </SafeAreaView>
  );
}
