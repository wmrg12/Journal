import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StatusBar, SafeAreaView } from "react-native";
import { diaryStyles as styles } from "../styles/createCoverStyles";
import { useRouter } from "expo-router";
import { uiColors, coverPalette } from "@/constants/colors";
import ColorPalette from "@/components/ColorPalette";

export default function CrearDiario() {
  const [selectedColor, setSelectedColor] = useState<string>(coverPalette[0]);
  const [diaryName, setDiaryName] = useState<string>("");
  const router = useRouter();
  const handleSave = () => {
    console.log("Guardando diario:", { name: diaryName, color: selectedColor });

    router.push({
      pathname: "/createPage",
      params: { name: diaryName, color: selectedColor },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={uiColors.background}
        barStyle="dark-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Diario</Text>
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
            placeholderTextColor={uiColors.gray}
            value={diaryName}
            onChangeText={setDiaryName}
          />
        </View>

        {/* Color picker */}
        <View style={styles.colorSection}>
          <Text style={styles.colorLabel}>Color:</Text>
          <ColorPalette
            options={coverPalette}
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
