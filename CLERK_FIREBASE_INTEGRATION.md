# 🔐 Integración Clerk + Firebase

Esta documentación explica cómo funciona la integración automática entre Clerk (autenticación) y Firebase (sincronización de datos).

## 🎯 ¿Qué hace esta integración?

La integración conecta automáticamente tu sistema de autenticación (Clerk) con la sincronización de datos (Firebase):

1. **Cuando el usuario inicia sesión** → Se configura automáticamente su ID para sincronizar con Firebase
2. **Cuando el usuario crea datos** → Se guardan en SQLite local y se sincronizan con Firebase bajo su ID
3. **Cuando el usuario cierra sesión** → Se detiene la sincronización
4. **Los datos son privados** → Cada usuario solo puede acceder a sus propios datos en Firebase

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Usuario inicia sesión                 │
│                    (Clerk Auth)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│              useAuthSync() detecta el login              │
│     Obtiene: user.id, user.email                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│         setCurrentUser(user.id)                         │
│    Configura el userId para Firebase sync               │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│            syncAllToFirebase()                          │
│   Sube datos locales a Firebase bajo /users/{userId}/   │
└────────────────────┬────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────┐
│        Usuario puede crear journals, páginas, etc.      │
│   Cada operación se guarda en SQLite + Firebase         │
│            Datos organizados por usuario                 │
└─────────────────────────────────────────────────────────┘
```

## 📁 Estructura de Datos en Firebase

Los datos se organizan automáticamente por usuario:

```
Firestore
└── users/
    └── {userId} (ID de Clerk)
        ├── journals/
        │   └── {journalId}/
        │       ├── id: "abc123"
        │       ├── name: "Mi Diario"
        │       ├── color: "#FF6B6B"
        │       ├── is_favorite: 0
        │       ├── created_at: 1234567890
        │       ├── updated_at: 1234567890
        │       └── synced_at: Timestamp
        │
        ├── pages/
        │   └── {pageId}/
        │       ├── id: "page123"
        │       ├── journal_id: "abc123"
        │       ├── page_number: 1
        │       └── ...
        │
        ├── page_texts/
        │   └── {textId}/
        │       └── ...
        │
        ├── page_shapes/
        │   └── {shapeId}/
        │       └── ...
        │
        ├── page_draws/
        │   └── {drawId}/
        │       └── ...
        │
        ├── page_stickers/
        │   └── {stickerId}/
        │       └── ...
        │
        └── tasks/
            └── {taskId}/
                └── ...
```

**Ejemplo real:**
```
users/
  user_2abc123xyz/ (ID de Clerk del usuario juan@gmail.com)
    journals/
      journal_001/
        name: "Diario Personal"
        color: "#FF6B6B"
    journals/
      journal_002/
        name: "Viajes"
        color: "#4ECDC4"
```

## 🚀 Cómo Funciona

### 1. Inicialización (Automática)

En `app/_layout.tsx`:

```tsx
export default function RootLayout() {
  // 1. Inicializa SQLite
  useEffect(() => {
    initDb();
  }, []);

  return (
    <ClerkProvider>
      <ClerkLoaded>
        <AppContent /> {/* Aquí se llama useAuthSync */}
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function AppContent() {
  // 2. Detecta automáticamente login/logout de Clerk
  useAuthSync();

  return <Stack>...</Stack>;
}
```

### 2. Login del Usuario

Cuando el usuario inicia sesión con Clerk:

```tsx
// El usuario hace login (puede ser con Google, email, etc.)
// Clerk maneja la autenticación

// useAuthSync detecta el cambio automáticamente:
const { user, isSignedIn } = useUser(); // Hook de Clerk

useEffect(() => {
  if (isSignedIn && user?.id) {
    // 🔑 Configurar userId para Firebase
    setCurrentUser(user.id);

    // 📤 Sincronizar datos locales
    syncAllToFirebase();

    console.log('✅ Usuario conectado:', user.emailAddresses[0].emailAddress);
  }
}, [isSignedIn, user?.id]);
```

**Logs que verás en la consola:**
```
🔐 User logged in: juan@gmail.com
👤 User ID: user_2abc123xyz
✅ SQLite Database initialized
✅ Initial sync completed
```

### 3. Crear Datos (Automático)

Cuando el usuario crea un journal:

```tsx
import { useJournals } from '@/hooks/useDatabase';

function MyComponent() {
  const { createJournal } = useJournals();

  const handleCreate = async () => {
    // Se guarda en SQLite Y se sincroniza con Firebase automáticamente
    await createJournal('Mi Diario', '#FF6B6B');

    // Esto internamente hace:
    // 1. Guarda en SQLite local
    // 2. Obtiene el userId actual (del hook useAuthSync)
    // 3. Guarda en Firebase en: users/{userId}/journals/{journalId}
  };

  return <Button onPress={handleCreate}>Crear</Button>;
}
```

**En Firebase verás:**
```
users/user_2abc123xyz/journals/abc123/
  id: "abc123"
  name: "Mi Diario"
  color: "#FF6B6B"
  synced_at: 2024-01-15 10:30:00
```

### 4. Logout (Automático)

Cuando el usuario cierra sesión:

```tsx
// useAuthSync detecta el cambio:
useEffect(() => {
  if (!isSignedIn) {
    // Limpiar configuración de sync
    setCurrentUser(null);

    console.log('🔓 User logged out');
  }
}, [isSignedIn]);
```

Los datos locales permanecen en SQLite, pero dejan de sincronizarse con Firebase.

## 🔒 Seguridad: Reglas de Firestore

**IMPORTANTE**: Configura estas reglas en Firebase Console para proteger los datos:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regla principal: cada usuario solo accede a sus datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Problema**: Clerk usa sus propios IDs, no Firebase Auth IDs.

### Solución: Usar Custom Claims

Necesitas crear una Cloud Function que vincule Clerk con Firebase Auth:

```typescript
// firebase-functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const syncClerkUser = functions.https.onCall(async (data, context) => {
  const { clerkUserId, email } = data;

  // Crear o actualizar usuario en Firebase Auth
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(email);
  } catch (error) {
    firebaseUser = await admin.auth().createUser({
      uid: clerkUserId,
      email: email,
    });
  }

  // Crear custom token
  const customToken = await admin.auth().createCustomToken(clerkUserId);

  return { customToken };
});
```

**Alternativa Simple** (para desarrollo):

Usa reglas más permisivas temporalmente:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      // Durante desarrollo: permitir cualquier lectura/escritura autenticada
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **Nota**: En producción, implementa la solución con Custom Claims.

## 📱 Ejemplo de Uso Completo

### Pantalla de Journals

```tsx
import { useCurrentUser } from '@/hooks/useAuthSync';
import { useJournals } from '@/hooks/useDatabase';

export function JournalsScreen() {
  // Información del usuario actual
  const { email, name } = useCurrentUser();

  // Journals del usuario (filtrados automáticamente por userId)
  const { journals, createJournal, loading } = useJournals();

  return (
    <View>
      <Text>Bienvenido, {name || email}</Text>

      <Button
        title="Crear Diario"
        onPress={() => createJournal('Nuevo Diario', '#FF6B6B')}
      />

      {journals.map(journal => (
        <Text key={journal.id}>{journal.name}</Text>
      ))}
    </View>
  );
}
```

### Pantalla de Perfil con Info de Sync

```tsx
import { useCurrentUser } from '@/hooks/useAuthSync';
import { useSyncStatus } from '@/hooks/useDatabase';
import { useClerk } from '@clerk/clerk-expo';

export function ProfileScreen() {
  const { email, name, imageUrl } = useCurrentUser();
  const { signOut } = useClerk();
  const { isSyncing, queueSize, syncAll } = useSyncStatus();

  const handleLogout = async () => {
    await signOut();
    // useAuthSync detectará el logout automáticamente
  };

  return (
    <View>
      <Image source={{ uri: imageUrl }} />
      <Text>{name}</Text>
      <Text>{email}</Text>

      <View>
        <Text>Estado de Sync:</Text>
        <Text>{isSyncing ? '🔄 Sincronizando...' : '✅ Sincronizado'}</Text>
        {queueSize > 0 && <Text>⏳ {queueSize} operaciones pendientes</Text>}

        <Button title="Sincronizar Ahora" onPress={syncAll} />
      </View>

      <Button title="Cerrar Sesión" onPress={handleLogout} />
    </View>
  );
}
```

## 🧪 Cómo Probar

### 1. Test de Login

```typescript
// En cualquier pantalla después del login
import { useCurrentUser } from '@/hooks/useAuthSync';

function TestComponent() {
  const { userId, email } = useCurrentUser();

  useEffect(() => {
    console.log('Current User ID:', userId);
    console.log('Current Email:', email);
  }, [userId, email]);
}
```

### 2. Test de Sincronización

```typescript
import { createJournal, listJournals } from '@/services/syncedDb';

async function testSync() {
  // Crear journal
  await createJournal('Test Sync', '#FF0000');

  // Esperar un momento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verificar en Firebase Console:
  // Firestore → users → {tu_clerk_user_id} → journals
  console.log('✅ Check Firebase Console!');
}
```

### 3. Test Multi-Usuario

```typescript
// 1. Login como usuario1@gmail.com
// 2. Crear algunos journals
// 3. Logout
// 4. Login como usuario2@gmail.com
// 5. Crear otros journals
// 6. Verificar en Firebase que están separados por userId
```

## 🔍 Debugging

### Ver logs de sincronización

```typescript
// En app/_layout.tsx, los logs son automáticos:
✅ SQLite Database initialized
🔐 User logged in: juan@gmail.com
👤 User ID: user_2abc123xyz
✅ Initial sync completed
```

### Verificar usuario actual

```typescript
import { getCurrentUser } from '@/services/syncedDb';

console.log('Current syncing user:', getCurrentUser());
```

### Ver estado de la cola offline

```typescript
import { getOfflineQueueSize } from '@/services/syncedDb';

console.log('Pending operations:', getOfflineQueueSize());
```

## ❓ Preguntas Frecuentes

### ¿Los datos se comparten entre usuarios?

No. Cada usuario tiene sus datos completamente aislados en:
```
users/{clerkUserId}/journals/...
users/{clerkUserId}/pages/...
```

### ¿Qué pasa si pierdo la conexión?

Los datos se guardan en SQLite local y se sincronizan cuando vuelva la conexión.

### ¿Puedo usar otro sistema de auth en lugar de Clerk?

Sí, solo necesitas modificar `useAuthSync.ts` para usar tu sistema de auth:

```typescript
// En lugar de useUser() de Clerk
const { user } = useTuSistemaDeAuth();

// El resto es igual
setCurrentUser(user.id);
```

### ¿Puedo compartir journals entre usuarios?

Actualmente no, pero puedes implementarlo creando una colección compartida:

```
shared_journals/
  {journalId}/
    owner_id: "user_abc"
    shared_with: ["user_xyz", "user_123"]
```

## 📚 Recursos

- [Documentación de Clerk](https://clerk.com/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [API Reference](./services/README.md)
- [Setup Guide](./SETUP_DATABASE.md)

## ✅ Checklist de Integración

- [x] Clerk configurado
- [x] Firebase configurado
- [x] SQLite inicializado
- [x] useAuthSync implementado
- [x] _layout.tsx actualizado
- [ ] Reglas de seguridad de Firestore configuradas
- [ ] Probado con múltiples usuarios
- [ ] Verificado aislamiento de datos

¡Tu app ahora sincroniza automáticamente los datos de cada usuario con Firebase usando su cuenta de Clerk! 🎉
