import { useCallback, useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
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

export function usePageImages(currentPageId: string | null) {
  const [pageImages, setPageImages] = useState<PageImage[]>([]);
  const pageImagesRef = useRef<PageImage[]>([]);
  pageImagesRef.current = pageImages;

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        }
        return;
      }
      setLoading(true);
      try {
        const rows = (await listPageImages(currentPageId)) as PageImage[];
        if (!mounted) return;

        const ordered = rows.slice().sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

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

      const { id } = await createPageImage(
        currentPageId,
        finalUri,
        20, 
        20, 
        150,
        150
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

      // functional update (evita dependencias)
      setPageImages((prev) => [...prev, newImg]);
      setSelectedImageId(id);
    } catch (e) {
      console.error("addImage error:", e);
    }
  }, [currentPageId]);

  // DUPLICATE image (creates DB entry with offset)
  const handleDuplicateImage = useCallback(async (id: string) => {
    const src = pageImagesRef.current.find((p) => p.id === id);
    if (!src || !currentPageId) return;
    try {
      const offset = 16;
      const x = Math.min(src.position_x + offset, 100000);
      const y = Math.min(src.position_y + offset, 100000);
      const { id: newId } = await createPageImage(
        currentPageId,
        src.uri,
        x,
        y,
        src.width,
        src.height
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
  }, [currentPageId]);

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