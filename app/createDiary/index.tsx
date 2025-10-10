import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StatusBar, SafeAreaView, Alert } from "react-native";
import { diaryStyles as styles } from "@/app/styles/createCoverStyles";
import { useRouter } from "expo-router"; 
import { uiColors, coverPalette } from "@/constants/colors";
import ColorPalette from "@/components/ColorPalette";
import { createJournal } from "@/src/db/dao";

export default function CrearDiario() {
  const [selectedColor, setSelectedColor] = useState<string>(coverPalette[0]);
  const [diaryName, setDiaryName] = useState<string>("");
  const router = useRouter();  
  const handleSave = async () => {
    if (!diaryName.trim()) {
      Alert.alert("Nombre requerido", "Ingresa un nombre para el diario.");
      return;
    }

    try {
      const { id } = await createJournal(diaryName.trim(), selectedColor);
      router.push({
        pathname: "/createPage",
        params: { journalId: id, color: selectedColor },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo crear el diario.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={uiColors.background} barStyle="dark-content" />

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
