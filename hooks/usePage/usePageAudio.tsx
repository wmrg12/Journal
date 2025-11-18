import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Alert } from 'react-native';
import {
  listPageAudios,
  createPageAudio,
  deletePageAudio,
  updatePageAudio,
  togglePageAudioLock,
  PageAudio,
} from '@/src/db/dao';

interface UsePageAudiosReturn {
  audios: PageAudio[];
  selectedAudioId: string | null;
  isLoading: boolean;
  setSelectedAudioId: (id: string | null) => void;
  getPanForAudio: (audioId: string) => Animated.ValueXY;
  handleAddAudio: (audioUri: string, audioType: 'recording' | 'file') => Promise<void>;
  handleDeleteAudio: (audioId: string) => Promise<void>;
  handleAudioPositionCommit: (audioId: string, x: number, y: number) => Promise<void>;
  handleToggleAudioLock: (audioId: string) => Promise<void>;
  handleDuplicateAudio: (audioId: string) => Promise<void>;
  handleSelectAudio: (audioId: string) => void;
}

export function usePageAudios(
  currentPageId: string | null,
  canvasWidth: number,
  canvasHeight: number,
): UsePageAudiosReturn {
  const [audios, setAudios] = useState<PageAudio[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const audioPans = useRef<Map<string, Animated.ValueXY>>(new Map());

  // Función para obtener/crear pan de audio
  const getPanForAudio = useCallback(
    (audioId: string): Animated.ValueXY => {
      if (!audioPans.current.has(audioId)) {
        const audio = audios.find((a) => a.id === audioId);
        const initialX = audio?.position_x ?? 0;
        const initialY = audio?.position_y ?? 0;
        const newPan = new Animated.ValueXY({ x: initialX, y: initialY });
        // Asegurar que el offset esté en cero al inicio
        newPan.setOffset({ x: 0, y: 0 });
        audioPans.current.set(audioId, newPan);
      }
      return audioPans.current.get(audioId)!;
    },
    [audios],
  );

  // Función para cargar audios
  const loadAudios = useCallback(async () => {
    if (!currentPageId) return;
    try {
      const loadedAudios = await listPageAudios(currentPageId);
      setAudios(loadedAudios);

      // Actualizar pans existentes solo si la posición cambió desde otra fuente
      loadedAudios.forEach((audio) => {
        if (audioPans.current.has(audio.id)) {
          const pan = audioPans.current.get(audio.id)!;
          const currentX = (pan.x as any)._value;
          const currentY = (pan.y as any)._value;

          // Solo actualizar si hay una diferencia significativa (más de 1px)
          if (
            Math.abs(currentX - audio.position_x) > 1 ||
            Math.abs(currentY - audio.position_y) > 1
          ) {
            pan.setOffset({ x: 0, y: 0 });
            pan.setValue({ x: audio.position_x, y: audio.position_y });
          }
        }
      });
    } catch (error) {
      console.error('Error loading audios:', error);
    }
  }, [currentPageId]);

  // Cargar audios cuando cambie la página
  useEffect(() => {
    if (currentPageId) {
      loadAudios();
    } else {
      setAudios([]);
      setSelectedAudioId(null);
      audioPans.current.clear();
    }
  }, [currentPageId, loadAudios]);

  // Agregar audio
  const handleAddAudio = useCallback(
    async (audioUri: string, audioType: 'recording' | 'file'): Promise<void> => {
      if (!currentPageId) return;

      try {
        setIsLoading(true);

        // Crear audio en el centro del canvas
        const centerX = canvasWidth / 2 - 25;
        const centerY = canvasHeight / 2 - 25;

        await createPageAudio(currentPageId, audioUri, audioType, centerX, centerY);
        await loadAudios();
      } catch (error) {
        console.error('Error creating audio:', error);
        Alert.alert('Error', 'No se pudo agregar el audio.');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentPageId, canvasWidth, canvasHeight, loadAudios],
  );

  // Eliminar audio
  const handleDeleteAudio = useCallback(
    async (audioId: string): Promise<void> => {
      try {
        await deletePageAudio(audioId);
        await loadAudios();
        setSelectedAudioId(null);
        audioPans.current.delete(audioId);
      } catch (error) {
        console.error('Error deleting audio:', error);
        Alert.alert('Error', 'No se pudo eliminar el audio.');
        throw error;
      }
    },
    [loadAudios],
  );

  // Actualizar posición del audio
  const handleAudioPositionCommit = useCallback(
    async (audioId: string, x: number, y: number): Promise<void> => {
      try {
        await updatePageAudio(audioId, { position_x: x, position_y: y });
      } catch (error) {
        console.error('Error updating audio position:', error);
      }
    },
    [],
  );

  // Toggle lock del audio
  const handleToggleAudioLock = useCallback(
    async (audioId: string): Promise<void> => {
      try {
        await togglePageAudioLock(audioId);
        await loadAudios();
      } catch (error) {
        console.error('Error toggling audio lock:', error);
        Alert.alert('Error', 'No se pudo cambiar el bloqueo del audio.');
        throw error;
      }
    },
    [loadAudios],
  );

  // Duplicar audio
  const handleDuplicateAudio = useCallback(
    async (audioId: string): Promise<void> => {
      if (!currentPageId) return;

      try {
        const audio = audios.find((a) => a.id === audioId);
        if (!audio) return;

        await createPageAudio(
          currentPageId,
          audio.audio_uri,
          audio.audio_type,
          audio.position_x + 20,
          audio.position_y + 20,
        );
        await loadAudios();
      } catch (error) {
        console.error('Error duplicating audio:', error);
        Alert.alert('Error', 'No se pudo duplicar el audio.');
        throw error;
      }
    },
    [currentPageId, audios, loadAudios],
  );

  // Seleccionar audio
  const handleSelectAudio = useCallback((audioId: string): void => {
    setSelectedAudioId(audioId);
  }, []);

  return {
    audios,
    selectedAudioId,
    isLoading,
    setSelectedAudioId,
    getPanForAudio,
    handleAddAudio,
    handleDeleteAudio,
    handleAudioPositionCommit,
    handleToggleAudioLock,
    handleDuplicateAudio,
    handleSelectAudio,
  };
}
