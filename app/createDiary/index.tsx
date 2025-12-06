import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { diaryStyles as styles } from '@/styles/createCoverStyles';
import { useRouter } from 'expo-router';
import { uiColors, coverPalette } from '@/constants/colors';
import ColorPalette from '@/components/ColorPalette';

export default function CrearDiario() {
  const [selectedColor, setSelectedColor] = useState<string>(coverPalette[0]);
  const [diaryName, setDiaryName] = useState<string>('');
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
  if (!diaryName.trim()) {
    Alert.alert('Nombre requerido', 'Ingresa un nombre para el diario.');
    return;
  }
  
  router.push({
    pathname: '/createPage',
    params: { 
      color: selectedColor,
      name: diaryName.trim(),  
      isNew: 'true'            
    },
  });
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={uiColors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color={uiColors.danger} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crear Diario</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content con ScrollView */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View style={styles.diaryPreview}>
          <View style={[styles.diary, { backgroundColor: selectedColor }]}>
            <View style={styles.diaryBinding} />
            <View style={styles.bookDivider} />
          </View>
        </View>

        {/* Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nombre:</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="Ingresa un nombre"
            placeholderTextColor={uiColors.grayO}
            value={diaryName}
            onChangeText={setDiaryName}
            maxLength={50}
          />
        </View>

        {/* Color picker */}
        <View style={styles.colorSection}>
          <Text style={styles.colorLabel}>Color:</Text>
          <ColorPalette options={coverPalette} value={selectedColor} onChange={setSelectedColor} />
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
