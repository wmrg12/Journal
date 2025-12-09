import React, { useRef, useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated, PanResponder, Alert, ActivityIndicator, Text } from 'react-native'; // 🔥 NUEVOS
import { MaterialIcons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import S from '@/styles/pageViewStyles';
import { uiColors } from '@/constants/colors';

type AudioItem = {
  id: string;
  page_id: string;
  audio_uri: string;
  audio_type: 'recording' | 'file';
  position_x: number;
  position_y: number;
  is_locked: boolean;
  created_at: number;
};

type DraggableAudioProps = {
  audio: AudioItem;
  getPanFor: (id: string) => Animated.ValueXY;
  onPositionCommit: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  locked: boolean;
  isSelected: boolean;
  isDownloading?: boolean; 
  zIndex?: number;
};

export const DraggableAudio: React.FC<DraggableAudioProps> = ({
  audio,
  getPanFor,
  onPositionCommit,
  onDelete,
  onToggleLock,
  onSelect,
  onDuplicate,
  locked,
  isSelected,
  isDownloading = false, 
  zIndex = 6,

}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const hasFinishedRef = useRef(false);
  const pan = getPanFor(audio.id);

  const isDraggingRef = useRef(false);
  const dragStartTimeRef = useRef(0);

  // ... (todo el código de reproducción se mantiene igual)

  const togglePlayback = async () => {
    if (isLoading || isDownloading) return; 

    try {
      setIsLoading(true);

      if (isPlaying) {
        if (soundRef.current) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
      } else {
        if (soundRef.current) {
          const status = await soundRef.current.getStatusAsync();

          if (status.isLoaded) {
            if (hasFinishedRef.current || status.didJustFinish) {
              await soundRef.current.setPositionAsync(0);
              hasFinishedRef.current = false;
            }

            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
        } else {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
            interruptionModeAndroid: 1,
            interruptionModeIOS: 1,
          });

          const { sound, status } = await Audio.Sound.createAsync(
            { uri: audio.audio_uri },
            {
              shouldPlay: true,
              volume: 1.0,
              rate: 1.0,
              shouldCorrectPitch: true,
            },
            onPlaybackStatusUpdate,
          );

          if (!status.isLoaded) {
            throw new Error('No se pudo cargar el audio');
          }

          soundRef.current = sound;
          hasFinishedRef.current = false;
          setIsPlaying(true);
        }
      }
    } catch (error: any) {
      console.error('Error al reproducir:', error);
      setIsPlaying(false);

      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch {}
        soundRef.current = null;
      }

      Alert.alert('Error', `No se pudo reproducir el audio.\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        hasFinishedRef.current = true;
        setIsPlaying(false);

        try {
          if (soundRef.current) {
            await soundRef.current.pauseAsync();
            await soundRef.current.setPositionAsync(0);
          }
        } catch (e) {
          console.error('Error al reiniciar:', e);
        }
      }
    } else if ('error' in status) {
      console.error('Playback error:', status.error);
      setIsPlaying(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar audio',
      `¿Seguro que deseas eliminar este audio ${audio.audio_type === 'recording' ? 'grabado' : 'importado'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (soundRef.current) {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
                soundRef.current = null;
              }

              setIsPlaying(false);
              onDelete(audio.id);
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el audio');
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      hasFinishedRef.current = false;
    };
  }, [audio.id]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
      setIsPlaying(false);
      hasFinishedRef.current = false;
    }
  }, [audio.audio_uri]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !locked && !isDownloading, //
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!locked && !isDownloading) { // 
          const moved = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
          if (moved) isDraggingRef.current = true;
          return moved;
        }
        return false;
      },
      onPanResponderGrant: () => {
        if (!locked && !isDownloading) { // 
          dragStartTimeRef.current = Date.now();
          isDraggingRef.current = false;
          onSelect(audio.id);

          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
          pan.setValue({ x: 0, y: 0 });
        }
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        if (!locked && !isDownloading) { // 
          const dragDuration = Date.now() - dragStartTimeRef.current;

          if (!isDraggingRef.current && dragDuration < 200) {
            togglePlayback();
          }

          pan.flattenOffset();

          const finalX = (pan.x as any)._value;
          const finalY = (pan.y as any)._value;

          onPositionCommit(audio.id, finalX, finalY);
          isDraggingRef.current = false;
        }
      },
    }),
  ).current;

  const animatedStyle = { transform: pan.getTranslateTransform(), zIndex: isSelected ? zIndex + 10000 : zIndex, };

  return (
    <Animated.View style={[S.audioContainer, animatedStyle]} {...panResponder.panHandlers}>
      {/*  MOSTRAR PLACEHOLDER SI ESTÁ DESCARGANDO */}
      {isDownloading ? (
        <View
          style={[
            S.audioButton,
            {
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              borderColor: '#3b82f6',
              borderStyle: 'dashed',
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      ) : (
        // Botón normal de reproducción
        <TouchableOpacity
          style={[S.audioButton, isSelected && S.audioButtonSelected, isLoading && { opacity: 0.5 }]}
          onPress={togglePlayback}
          activeOpacity={0.8}
          disabled={isLoading || locked}
        >
          <MaterialIcons
            name={isPlaying ? 'album' : 'music-note'}
            size={32}
            color={isSelected ? uiColors.primary : uiColors.brown}
          />
        </TouchableOpacity>
      )}

      {/*  OCULTAR CONTROLES SI ESTÁ DESCARGANDO */}
      {isSelected && !locked && !isDownloading && (
        <View style={S.audioControls}>
          <TouchableOpacity
            style={S.controlButton}
            onPress={() => onDuplicate(audio.id)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="content-copy" size={16} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.controlButton, S.deleteButton]}
            onPress={confirmDelete}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {locked && !isDownloading && (
        <View style={S.lockIndicator}>
          <MaterialIcons name="lock" size={16} color="#6B7280" />
        </View>
      )}
    </Animated.View>
  );
};

export default DraggableAudio;