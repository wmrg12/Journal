import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Alert } from 'react-native';
import { downloadAudioFromSupabase, getFileNameFromUrl } from '@/src/service/storageService';
import * as FileSystem from 'expo-file-system/legacy'; 

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
  downloadingIds: Set<string>;
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
  getToken: () => Promise<string | null>
): UsePageAudiosReturn {
  const [audios, setAudios] = useState<PageAudio[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const audioPans = useRef<Map<string, Animated.ValueXY>>(new Map());

  // Función para obtener/crear pan de audio
  const getPanForAudio = useCallback(
    (audioId: string): Animated.ValueXY => {
      if (!audioPans.current.has(audioId)) {
        const audio = audios.find((a) => a.id === audioId);
        const initialX = audio?.position_x ?? 0;
        const initialY = audio?.position_y ?? 0;
        const newPan = new Animated.ValueXY({ x: initialX, y: initialY });
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
      
      console.log(` Total audios en página: ${loadedAudios.length}`); 
      
      // Identificar audios que necesitan descarga
      const needsDownload = loadedAudios
        .filter(a => a.audio_uri.startsWith('http://') || a.audio_uri.startsWith('https://'))
        .map(a => a.id);
      
      setDownloadingIds(new Set(needsDownload));
      
      if (needsDownload.length > 0) {
        console.log(`${needsDownload.length} audios necesitan descarga`); 
      }
      
      // Descargar audios de Supabase
      const processedAudios = await Promise.all(
        loadedAudios.map(async (audio) => {
          // Log para cada audio
          const uriPreview = audio.audio_uri.substring(0, 60) + (audio.audio_uri.length > 60 ? '...' : '');
          console.log(`Audio ${audio.id.substring(0, 8)}: ${uriPreview}`);
          
          if (audio.audio_uri && (audio.audio_uri.startsWith('http://') || audio.audio_uri.startsWith('https://'))) {
            try {
              console.log(` Descargando audio ${audio.id.substring(0, 8)} desde Supabase...`);
              const fileName = getFileNameFromUrl(audio.audio_uri);
              const localUri = await downloadAudioFromSupabase(audio.audio_uri, fileName);
              
              //  Verificar que el archivo exista
              const fileInfo = await FileSystem.getInfoAsync(localUri);
              console.log(`Audio descargado: ${localUri}`);
              if (fileInfo.exists && 'size' in fileInfo) {
                console.log(` Archivo existe: true, Tamaño: ${fileInfo.size} bytes`);
              } else {
                console.log(`Archivo existe: ${fileInfo.exists}`);
              }
              await updatePageAudio(audio.id, { audio_uri: localUri });
              
              // Remover de descarga
              setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(audio.id);
                return next;
              });
              
              return { ...audio, audio_uri: localUri };
            } catch (error) {
              console.error(` Error descargando audio ${audio.id}:`, error);
              
              setDownloadingIds(prev => {
                const next = new Set(prev);
                next.delete(audio.id);
                return next;
              });
              
              return audio;
            }
          }
          
          //  Verificar audios que ya son file://
          if (audio.audio_uri.startsWith('file://')) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(audio.audio_uri);
              if (!fileInfo.exists) {
                console.warn(` Audio ${audio.id.substring(0, 8)} NO existe localmente: ${audio.audio_uri}`);
              } else if ('size' in fileInfo) {
                console.log(` Audio ${audio.id.substring(0, 8)} existe: ${fileInfo.size} bytes`);
              } else {
                console.log(`Audio ${audio.id.substring(0, 8)} existe`);
              }
            } catch (error) {
              console.error(` Error verificando audio ${audio.id}:`, error);
            }
          }

          return audio;
        })
      );

      setAudios(processedAudios);

      // Actualizar pans existentes
      processedAudios.forEach((audio) => {
        if (audioPans.current.has(audio.id)) {
          const pan = audioPans.current.get(audio.id)!;
          const currentX = (pan.x as any)._value;
          const currentY = (pan.y as any)._value;

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

        const centerX = canvasWidth / 2 - 25;
        const centerY = canvasHeight / 2 - 25;

        const token = await getToken();
        
        if (!token) {
          console.error('No se pudo obtener el token');
          Alert.alert('Error', 'No se pudo autenticar. Intenta nuevamente.');
          return;
        }

        await createPageAudio(currentPageId, audioUri, audioType, centerX, centerY, token);
        await loadAudios();
      } catch (error) {
        console.error('Error creating audio:', error);
        Alert.alert('Error', 'No se pudo agregar el audio.');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentPageId, canvasWidth, canvasHeight, loadAudios, getToken], 
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

        const token = await getToken();
        
        if (!token) {
          console.error('No se pudo obtener el token');
          Alert.alert('Error', 'No se pudo autenticar. Intenta nuevamente.');
          return;
        }

        await createPageAudio(
          currentPageId,
          audio.audio_uri,
          audio.audio_type,
          audio.position_x + 20,
          audio.position_y + 20,
          token, 
        );
        await loadAudios();
      } catch (error) {
        console.error('Error duplicating audio:', error);
        Alert.alert('Error', 'No se pudo duplicar el audio.');
        throw error;
      }
    },
    [currentPageId, audios, loadAudios, getToken], 
  );

  // Seleccionar audio
  const handleSelectAudio = useCallback((audioId: string): void => {
    setSelectedAudioId(audioId);
  }, []);

  return {
    audios,
    selectedAudioId,
    isLoading,
    downloadingIds,
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