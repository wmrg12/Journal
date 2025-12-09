import { useCallback, useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { downloadImageFromSupabase, getFileNameFromUrl } from "@/src/service/storageService";
import * as FileSystem from 'expo-file-system/legacy';

import {
  listPageImages,
  createPageImage,
  updatePageImage,
  deletePageImage,
} from "@/src/db/dao";

export type PageImage = {
  id: string;
  page_id: string;
  uri: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  created_at: number;
  updated_at: number;
};

export function usePageImages(currentPageId: string | null, getToken: () => Promise<string | null>) {
  const [pageImages, setPageImages] = useState<PageImage[]>([]);
  const pageImagesRef = useRef<PageImage[]>([]);
  pageImagesRef.current = pageImages;

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set()); 

  const sameImages = (a: PageImage[], b: PageImage[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id) return false;
      if ((a[i].updated_at ?? 0) !== (b[i].updated_at ?? 0)) return false;
    }
    return true;
  };

    useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentPageId) {
        if (mounted) {
          if (pageImagesRef.current.length > 0) setPageImages([]);
          setDownloadingIds(new Set()); 
        }
        return;
      }
      setLoading(true);
      try {
        const rows = (await listPageImages(currentPageId)) as PageImage[];
        if (!mounted) return;

        console.log(` Total imágenes en página: ${rows.length}`); 

        // Identificar imágenes que necesitan descarga
        const needsDownload = rows
          .filter(img => img.uri.startsWith('http://') || img.uri.startsWith('https://'))
          .map(img => img.id);
        
        setDownloadingIds(new Set(needsDownload));
        
        if (needsDownload.length > 0) {
          console.log(` ${needsDownload.length} imágenes necesitan descarga`); 
        }

        // Descargar imágenes de Supabase
        const processedImages = await Promise.all(
          rows.map(async (img) => {
            // Log para cada imagen
            const uriPreview = img.uri.substring(0, 60) + (img.uri.length > 60 ? '...' : '');
            console.log(` Imagen ${img.id.substring(0, 8)}: ${uriPreview}`);
            
            if (img.uri && (img.uri.startsWith('http://') || img.uri.startsWith('https://'))) {
              try {
                console.log(` Descargando imagen ${img.id.substring(0, 8)} desde Supabase...`);
                const fileName = getFileNameFromUrl(img.uri);
                const localUri = await downloadImageFromSupabase(img.uri, fileName);
                
                // Verificar que el archivo exista
                const fileInfo = await FileSystem.getInfoAsync(localUri);
                console.log(` Imagen descargada: ${localUri}`);
                if (fileInfo.exists && 'size' in fileInfo) {
                  console.log(`Archivo existe: true, Tamaño: ${fileInfo.size} bytes`);
                } else {
                  console.log(`Archivo existe: ${fileInfo.exists}`);
                }
                
                await updatePageImage(img.id, { uri: localUri } as any);
                
                // Remover de la lista de descarga
                setDownloadingIds(prev => {
                  const next = new Set(prev);
                  next.delete(img.id);
                  return next;
                });
                
                return { ...img, uri: localUri };
              } catch (error) {
                console.error(`Error descargando imagen ${img.id}:`, error);
                
                setDownloadingIds(prev => {
                  const next = new Set(prev);
                  next.delete(img.id);
                  return next;
                });
                
                return img;
              }
            }
            
            // Verificar imágenes que ya son file://
            if (img.uri.startsWith('file://')) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(img.uri);
                if (!fileInfo.exists) {
                  console.warn(`Imagen ${img.id.substring(0, 8)} NO existe localmente: ${img.uri}`);
                } else if ('size' in fileInfo) {
                  console.log(`Imagen ${img.id.substring(0, 8)} existe: ${fileInfo.size} bytes`);
                } else {
                  console.log(`Imagen ${img.id.substring(0, 8)} existe`);
                }
              } catch (error) {
                console.error(`Error verificando imagen ${img.id}:`, error);
              }
            }
            
            return img;
          })
        );

        const ordered = processedImages.slice().sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

        if (!sameImages(pageImagesRef.current, ordered)) {
          setPageImages(ordered);
        }
      } catch (e) {
        console.error("Error cargando pageImages:", e);
        if (mounted) setPageImages([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentPageId]);

  const addImage = useCallback(async () => {
    if (!currentPageId) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;
      const uri = res.assets[0].uri;
      const finalUri = uri;

      // Obtener token
      const token = await getToken();
      
      if (!token) {
        console.error('No se pudo obtener el token');
        return;
      }

      const { id } = await createPageImage(
        currentPageId,
        finalUri,
        20, 
        20, 
        150,
        150,
        token 
      );

      const now = Math.floor(Date.now() / 1000);
      const newImg: PageImage = {
        id,
        page_id: currentPageId,
        uri: finalUri,
        position_x: 20,
        position_y: 20,
        width: 150,
        height: 150,
        rotation: 0,
        created_at: now,
        updated_at: now,
      };

      setPageImages((prev) => [...prev, newImg]);
      setSelectedImageId(id);
    } catch (e) {
      console.error("addImage error:", e);
    }
  }, [currentPageId, getToken]); 

  const handleDuplicateImage = useCallback(async (id: string) => {
    const src = pageImagesRef.current.find((p) => p.id === id);
    if (!src || !currentPageId) return;
    try {
      const offset = 16;
      const x = Math.min(src.position_x + offset, 100000);
      const y = Math.min(src.position_y + offset, 100000);
      
      // Obtener token
      const token = await getToken();
      
      if (!token) {
        console.error('No se pudo obtener el token');
        return;
      }
      
      const { id: newId } = await createPageImage(
        currentPageId,
        src.uri,
        x,
        y,
        src.width,
        src.height,
        token 
      );

      const now = Math.floor(Date.now() / 1000);
      const copy: PageImage = {
        id: newId,
        page_id: currentPageId,
        uri: src.uri,
        position_x: x,
        position_y: y,
        width: src.width,
        height: src.height,
        rotation: src.rotation ?? 0,
        created_at: now,
        updated_at: now,
      };

      setPageImages((prev) => [...prev, copy]);
      setSelectedImageId(newId);
    } catch (e) {
      console.error("Error duplicando imagen:", e);
    }
  }, [currentPageId, getToken]); 
  
  // REPLACE URI edit from modal
  const replaceImage = useCallback(async (id: string, newUri: string, opts?: { width?: number; height?: number; rotation?: number }) => {
    const img = pageImagesRef.current.find((p) => p.id === id);
    if (!img) return;
    const newWidth = opts?.width ?? img.width;
    const newHeight = opts?.height ?? img.height;
    const newRotation = opts?.rotation ?? img.rotation ?? 0;
    try {
      await updatePageImage(id, { uri: newUri, width: newWidth, height: newHeight, rotation: newRotation } as any);
      const now = Math.floor(Date.now() / 1000);
      setPageImages((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, uri: newUri, width: newWidth, height: newHeight, rotation: newRotation, updated_at: now } : p
        )
      );
    } catch (e) {
      console.error("replaceImage error:", e);
    }
  }, []);

  const pickAndReplaceImage = useCallback(async (id: string) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) return;
      const uri = res.assets[0].uri;
      await replaceImage(id, uri);
    } catch (e) {
      console.error("pickAndReplaceImage error:", e);
    }
  }, [replaceImage]);

  const handleDeleteImage = useCallback(async (id: string) => {
    try {
      await deletePageImage(id);
    } catch (e) {
      console.warn("deletePageImage warning (continuing):", e);
    } finally {
      setPageImages((prev) => prev.filter((p) => p.id !== id));
      setSelectedImageId((s) => (s === id ? null : s));
    }
  }, []);

  const handleMoveEnd = useCallback(async (id: string, x: number, y: number) => {
    setPageImages((prev) => prev.map((p) => (p.id === id ? { ...p, position_x: x, position_y: y } : p)));
    try {
      await updatePageImage(id, { position_x: x, position_y: y } as any);
    } catch (e) {
      console.error("Error guardando movimiento:", e);
    }
  }, []);

  const handleResizeEnd = useCallback(async (id: string, width: number, height: number) => {
    setPageImages((prev) => prev.map((p) => (p.id === id ? { ...p, width, height } : p)));
    try {
      await updatePageImage(id, { width, height } as any);
    } catch (e) {
      console.error("Error guardando tamaño:", e);
    }
  }, []);

  const handleRotateEnd = useCallback(async (id: string, rotation: number) => {
    setPageImages((prev) => prev.map((p) => (p.id === id ? { ...p, rotation } : p)));
    try {
      await updatePageImage(id, { rotation } as any);
    } catch (e) {
      console.error("Error guardando rotación:", e);
    }
  }, []);

  return {
    pageImages,
    selectedImageId,
    setSelectedImageId,
    downloadingIds,
    addImage,
    handleEditImage: pickAndReplaceImage,
    handleDeleteImage,
    handleMoveEnd,
    handleResizeEnd,
    handleRotateEnd,
    handleDuplicateImage,
    replaceImage,
    pickAndReplaceImage,
    loading,
  };
}