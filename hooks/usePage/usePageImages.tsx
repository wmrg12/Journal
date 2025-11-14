import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { rotate } from "@shopify/react-native-skia";

export function usePageImages(currentPageId: string | null) {
  const [pageImages, setPageImages] = useState<
    {
      id: string;
      uri: string;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation?: number;
    }[]
  >([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // AGREGAR IMAGEN
  const addImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0 && currentPageId) {
        const image = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          x: 50,
          y: 50,
          width: 150,
          height: 150,
          rotation: 0,
        };
        setPageImages((prev) => [...prev, image]);
      }
    } catch (e) {
      console.error("Error al agregar imagen:", e);
    }
  };

  // DUPLICAR IMAGEN
  const handleDuplicateImage = (id: string) => {
    setPageImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (!img) return prev;
      const offset = 16; 
      const copy = {
        ...img,
        id: Date.now().toString(),
        x: Math.min((img.x ?? 50) + offset, 10000),
        y: Math.min((img.y ?? 50) + offset, 10000),
      };
      return [...prev, copy];
    });
  };

  // EDITAR IMAGEN SELECCIONADA (recortar, girar, etc.)
  const handleEditImage = async (id: string) => {
    const image = pageImages.find((img) => img.id === id);
    if (!image) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // ✅ solo al editar
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const editedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );

        setPageImages((prev) =>
          prev.map((img) =>
            img.id === id ? { ...img, uri: editedImage.uri } : img
          )
        );
      }
    } catch (e) {
      console.error("Error al editar imagen:", e);
    }
  };

  // ELIMINAR IMAGEN
  const handleDeleteImage = (id: string) => {
    setPageImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  };

  // MOVER IMAGEN
  const handleMoveEnd = (id: string, x: number, y: number) => {
    setPageImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, x, y } : img))
    );
  };

  // CAMBIAR TAMAÑO
  const handleResizeEnd = (id: string, width: number, height: number) => {
    setPageImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, width, height } : img))
    );
  };

  // CAMBIAR ROTACIÓN
  const handleRotateEnd = (id: string, rotation: number) => {
    setPageImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, rotation } : img))
    );
  };

// REEMPLAZAR URI (usar para guardar cambios del modal)
  const replaceImage = (id: string, newUri: string, opts?: { width?: number; height?: number; rotation?: number }) => {
    setPageImages(prev =>
      prev.map(img =>
        img.id === id ? { ...img, uri: newUri, width: opts?.width ?? img.width, height: opts?.height ?? img.height, rotation: opts?.rotation ?? img.rotation } : img
      )
    );
  };

  // (Opcional) función para abrir galería y reemplazar — sólo si la quieres aquí
  const pickAndReplaceImage = async (id: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        replaceImage(id, uri);
      }
    } catch (e) {
      console.error("pickAndReplaceImage error:", e);
    }
  };


  return {
    pageImages,
    selectedImageId,
    setSelectedImageId,
    addImage,
    handleEditImage,
    handleDeleteImage,
    handleMoveEnd,
    handleResizeEnd,
    handleRotateEnd,
    handleDuplicateImage,
    replaceImage,
    pickAndReplaceImage,
  };
}
