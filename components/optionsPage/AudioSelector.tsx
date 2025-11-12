import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialIcons } from '@expo/vector-icons';
import S from '@/styles/pageViewStyles';
import { uiColors } from '@/constants/colors';

type AudioSelectorProps = {
  visible: boolean;
  onClose: () => void;
  onAudioSelected: (audioUri: string, audioType: 'recording' | 'file') => void;
};

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  visible,
  onClose,
  onAudioSelected,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'record' | 'import'>('record');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos para acceder al micrófono');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingTime(0);
      startPulseAnimation();

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000) as unknown as NodeJS.Timeout;
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      alert('No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !isRecording) return;

    try {
      setIsRecording(false);
      stopPulseAnimation();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recordingRef.current.getURI();
      if (uri) {
        onAudioSelected(uri, 'recording');
      }

      recordingRef.current = null;
      setRecordingTime(0);
      onClose();
    } catch (error) {
      console.error('Error al detener grabación:', error);
      alert('Error al guardar la grabación');
    }
  };

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        onAudioSelected(file.uri, 'file');
        onClose();
      }
    } catch (error) {
      console.error('Error al seleccionar archivo:', error);
      alert('Error al seleccionar el archivo');
    }
  };

  const handleStart = () => {
    if (selectedOption === 'record') {
      startRecording();
    } else {
      handleFileSelect();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={S.audioModalOverlay}>
          <TouchableOpacity style={S.audioModalBackground} activeOpacity={1} onPress={onClose} />
          <View style={S.audioOptionsContainer}>
            <View style={S.audioOptionsHeader}>
              <MaterialIcons name="edit" size={20} color="#374151" />
              <Text style={S.audioOptionsTitle}>Audio</Text>
            </View>

            {!isRecording ? (
              <>
                <Text style={S.sectionLabel}>Elige una opción</Text>
                <View style={S.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      S.optionButton,
                      selectedOption === 'record' && {
                        backgroundColor: '#FEE2E2',
                        borderColor: uiColors.primary,
                      },
                    ]}
                    onPress={() => setSelectedOption('record')}
                    activeOpacity={0.7}
                    accessibilityLabel="Grabar audio"
                    accessibilityRole="button"
                  >
                    <View style={S.optionIconContainer}>
                      <MaterialIcons
                        name="mic"
                        size={30}
                        color={selectedOption === 'record' ? uiColors.primary : '#6B7280'}
                      />
                    </View>
                    <Text style={S.optionLabel}>Grabar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      S.optionButton,
                      selectedOption === 'import' && {
                        backgroundColor: '#FEE2E2',
                        borderColor: uiColors.primary,
                      },
                    ]}
                    onPress={() => setSelectedOption('import')}
                    activeOpacity={0.7}
                    accessibilityLabel="Importar música"
                    accessibilityRole="button"
                  >
                    <View style={S.optionIconContainer}>
                      <MaterialIcons
                        name="library-music"
                        size={30}
                        color={selectedOption === 'import' ? uiColors.primary : '#6B7280'}
                      />
                    </View>
                    <Text style={S.optionLabel}>Importar</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={S.startButton} onPress={handleStart} activeOpacity={0.8}>
                  <Text style={S.startButtonText}>
                    {selectedOption === 'record' ? 'Empezar a grabar' : 'Seleccionar archivo'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={S.recordingContainer}>
                <Animated.View
                  style={[S.recordingIconContainer, { transform: [{ scale: pulseAnim }] }]}
                >
                  <MaterialIcons name="mic" size={40} color={uiColors.primary} />
                </Animated.View>

                <Text style={S.recordingTime}>{formatTime(recordingTime)}</Text>

                <TouchableOpacity
                  style={S.stopButton}
                  onPress={stopRecording}
                  activeOpacity={0.8}
                  accessibilityLabel="Detener grabación"
                  accessibilityRole="button"
                >
                  <MaterialIcons name="stop" size={25} color="#FFFFFF" />
                  <Text style={S.stopButtonText}>Detener</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AudioSelector;
