/**
 * Hook para sincronizar automáticamente el usuario de Clerk con Firebase
 *
 * Este hook:
 * 1. Detecta cuando el usuario inicia/cierra sesión en Clerk
 * 2. Configura automáticamente el userId para sincronización con Firebase
 * 3. Sincroniza todos los datos locales a Firebase cuando el usuario inicia sesión
 * 4. Limpia la configuración cuando el usuario cierra sesión
 */

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { setCurrentUser, syncAllToFirebase, getCurrentUser } from '../services/syncedDb';

export function useAuthSync() {
  const { user, isLoaded, isSignedIn } = useUser();
  const hasInitialSyncRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Usuario ha iniciado sesión
    if (isSignedIn && user?.id) {
      const currentUserId = getCurrentUser();

      // Solo configurar si es diferente al actual
      if (currentUserId !== user.id) {
        console.log('🔐 User logged in:', user.emailAddresses[0]?.emailAddress);
        console.log('👤 User ID:', user.id);

        // Configurar usuario para sincronización
        setCurrentUser(user.id);

        // Sincronizar datos locales con Firebase (solo la primera vez)
        if (!hasInitialSyncRef.current) {
          hasInitialSyncRef.current = true;

          syncAllToFirebase()
            .then(() => {
              console.log('✅ Initial sync completed');
            })
            .catch((error) => {
              console.warn('⚠️ Initial sync failed (will retry later):', error.message);
            });
        }
      }
    }
    // Usuario ha cerrado sesión
    else if (!isSignedIn) {
      const currentUserId = getCurrentUser();

      if (currentUserId) {
        console.log('🔓 User logged out');

        // Limpiar usuario actual
        setCurrentUser(null as any);
        hasInitialSyncRef.current = false;
      }
    }
  }, [isLoaded, isSignedIn, user?.id]);

  return {
    isReady: isLoaded,
    isSignedIn,
    user,
    userId: user?.id || null,
    userEmail: user?.emailAddresses[0]?.emailAddress || null,
  };
}

/**
 * Hook para obtener información del usuario actual
 */
export function useCurrentUser() {
  const { user, isSignedIn } = useUser();

  return {
    isSignedIn,
    userId: user?.id || null,
    email: user?.emailAddresses[0]?.emailAddress || null,
    name: user?.firstName || user?.username || null,
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || null,
    imageUrl: user?.imageUrl || null,
    user,
  };
}
