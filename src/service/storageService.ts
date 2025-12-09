// src/service/storageService.ts
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from "expo-file-system/legacy";
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET_NAME = 'user-files';

/**
 * Sube una imagen a Supabase Storage
 */
export async function uploadImageToSupabase(
  localUri: string,
  remotePath: string,
  token: string
): Promise<string> {
  try {
    console.log(' Subiendo imagen a Supabase...');
    console.log('Local URI:', localUri);
    console.log('Remote path:', remotePath);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });

    const arrayBuffer = decode(base64);

    const extension = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const contentType = mimeTypes[extension] || 'image/jpeg';

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(remotePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(' Error subiendo a Supabase:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(remotePath);

    console.log('Imagen subida exitosamente:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(' Error en uploadImageToSupabase:', error);
    throw error;
  }
}

/**
 * Sube un audio a Supabase Storage
 */
export async function uploadAudioToSupabase(
  localUri: string,
  remotePath: string,
  token: string
): Promise<string> {
  try {
    console.log('Subiendo audio a Supabase...');
    console.log('Local URI:', localUri);
    console.log('Remote path:', remotePath);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    });

    const arrayBuffer = decode(base64);

    const extension = localUri.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeTypes: { [key: string]: string } = {
      m4a: 'audio/m4a',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
    };
    const contentType = mimeTypes[extension] || 'audio/m4a';

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(remotePath, arrayBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(' Error subiendo audio a Supabase:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(remotePath);

    console.log('Audio subido exitosamente:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(' Error en uploadAudioToSupabase:', error);
    throw error;
  }
}

/**
 * @param remoteUrl URL pública de la imagen en Supabase
 * @param localFileName Nombre del archivo local
 * @returns URI local del archivo descargado
 */
export async function downloadImageFromSupabase(
  remoteUrl: string,
  localFileName: string
): Promise<string> {
  try {
    console.log(' Descargando imagen desde Supabase...');
    console.log('Remote URL:', remoteUrl);

    // Crear directorio de imágenes si no existe
    const imageDir = `${FileSystem.documentDirectory}images/`;
    const dirInfo = await FileSystem.getInfoAsync(imageDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imageDir, { intermediates: true });
      console.log(' Directorio de imágenes creado');
    }

    const localUri = `${imageDir}${localFileName}`;

    // Verificar si ya existe localmente
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log(' Imagen ya existe localmente:', localUri);
      return localUri;
    }

    // Descargar el archivo
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
    
    if (downloadResult.status === 200) {
      console.log(' Imagen descargada exitosamente:', downloadResult.uri);
      return downloadResult.uri;
    } else {
      throw new Error(`Error descargando imagen: status ${downloadResult.status}`);
    }
  } catch (error) {
    console.error(' Error descargando imagen:', error);
    throw error;
  }
}

/**
 * @param remoteUrl URL pública del audio en Supabase
 * @param localFileName Nombre del archivo local
 * @returns URI local del archivo descargado
 */
export async function downloadAudioFromSupabase(
  remoteUrl: string,
  localFileName: string
): Promise<string> {
  try {
    console.log('Descargando audio desde Supabase...');
    console.log('Remote URL:', remoteUrl);

    // Crear directorio de audios si no existe
    const audioDir = `${FileSystem.documentDirectory}audios/`;
    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      console.log(' Directorio de audios creado');
    }

    const localUri = `${audioDir}${localFileName}`;

    // Verificar si ya existe localmente
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log('Audio ya existe localmente:', localUri);
      return localUri;
    }

    // Descargar el archivo
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
    
    if (downloadResult.status === 200) {
      console.log(' Audio descargado exitosamente:', downloadResult.uri);
      return downloadResult.uri;
    } else {
      throw new Error(`Error descargando audio: status ${downloadResult.status}`);
    }
  } catch (error) {
    console.error(' Error descargando audio:', error);
    throw error;
  }
}

/**
 * Elimina un archivo de Supabase Storage
 */
export async function deleteFileFromSupabase(
  fileUrl: string,
  token: string
): Promise<void> {
  try {
    console.log(' Eliminando archivo de Supabase:', fileUrl);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);

    if (bucketIndex === -1) {
      throw new Error('URL inválida, no contiene el nombre del bucket');
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      console.error('Error eliminando archivo:', error);
      throw error;
    }

    console.log('Archivo eliminado exitosamente');
  } catch (error) {
    console.error(' Error en deleteFileFromSupabase:', error);
    throw error;
  }
}


export function getFileNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch {
    return `file_${Date.now()}`;
  }
}