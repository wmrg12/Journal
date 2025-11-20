import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { coverPalette, uiColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { listJournals, updateJournalCover, deleteJournal } from '@/src/db/dao';
import { editCoverStyles as styles } from '@/styles/editCoverStyles';
import ColorPalette from '@/components/ColorPalette';

export default function EditCover() {
  const router = useRouter();
  const { journalId } = useLocalSearchParams<{ journalId: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(coverPalette[0]);
  const [diaryName, setDiaryName] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        if (!journalId) {
          Alert.alert('Error', 'journalId no recibido.');
          router.back();
          return;
        }

        const journals = await listJournals();
        const journal = journals.find((j) => j.id === journalId);

        if (!journal) {
          Alert.alert('Error', 'No se pudo cargar el diario.');
          router.back();
          return;
        }

        setDiaryName(journal.name ?? '');
        setSelectedColor(journal.color ?? coverPalette[0]);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo cargar el diario.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [journalId]);

  const handleSave = async () => {
    if (!journalId || saving) return;

    if (!diaryName.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para la libreta.');
      return;
    }

    setSaving(true);
    try {
      await updateJournalCover(journalId, {
        name: diaryName.trim(),
        color: selectedColor,
      });
      router.replace('/tabs/home');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar libreta',
      '¿Estás seguro de que quieres eliminar esta libreta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournal(journalId as string);
              router.replace('/tabs/home');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo eliminar la libreta.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#FFF8F0" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFF8F0" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ marginTop: 30 }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={uiColors.danger} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar portada</Text>
        <TouchableOpacity
          style={[{ marginTop: 30 }, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="checkmark" size={24} color={uiColors.danger} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.content}>
            {/* Preview del diario */}
            <View style={styles.diaryPreview}>
              <View style={[styles.diary, { backgroundColor: selectedColor }]}>
                <View style={styles.diaryBinding} />
              </View>
            </View>

            {/* Input para editar nombre*/}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre:</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Nombre de la libreta"
                placeholderTextColor={uiColors.grayO}
                value={diaryName}
                onChangeText={setDiaryName}
                maxLength={50}
              />
            </View>

            {/* Selector de color */}
            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>Color:</Text>
              <ColorPalette
                options={coverPalette}
                value={selectedColor}
                onChange={setSelectedColor}
              />
            </View>

            {/* Boton eliminar */}
            <View style={styles.deleteSection}>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Eliminar libreta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
