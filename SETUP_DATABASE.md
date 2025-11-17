# Guía de Instalación: SQLite + Firebase

Esta guía te ayudará a integrar la base de datos sincronizada (SQLite local + Firebase cloud) en tu aplicación Journal.

## 📋 Prerrequisitos

- Proyecto Expo/React Native configurado
- Cuenta de Firebase creada
- Sistema de autenticación funcionando (Clerk, Firebase Auth, etc.)

## 🚀 Paso 1: Instalar Dependencias

```bash
# SQLite y Crypto para IDs
npx expo install expo-sqlite expo-crypto

# Firebase ya está instalado, pero verifica la versión
npm list firebase
```

## 🔧 Paso 2: Configurar Firebase

Tu archivo `config/FirebaseConfig.js` ya está configurado:

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIRREBASE_API_KEY,
  authDomain: "journalapp-aafb5.firebaseapp.com",
  projectId: "journalapp-aafb5",
  storageBucket: "journalapp-aafb5.firebasestorage.app",
  messagingSenderId: "1060143274395",
  appId: "1:1060143274395:web:c2a7a085878038f50da93e",
  measurementId: "G-61JLKHXJDS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

**Importante**: Asegúrate de que tu `.env` tenga la API key:

```env
EXPO_PUBLIC_FIRREBASE_API_KEY=tu_api_key_aqui
```

## 📦 Paso 3: Estructura de Archivos Creada

Los siguientes archivos han sido creados:

```
Journal/
├── services/
│   ├── db.ts                    # SQLite DAO (local)
│   ├── firebaseSync.ts          # Sincronización con Firebase
│   ├── syncedDb.ts             # API unificada (USA ESTE)
│   └── README.md               # Documentación detallada
├── hooks/
│   └── useDatabase.ts          # React hooks para usar en componentes
├── examples/
│   └── DatabaseUsageExample.tsx # Ejemplos de uso completos
└── config/
    └── FirebaseConfig.js       # Configuración Firebase (ya existía)
```

## 🎯 Paso 4: Inicializar en tu App

### Opción A: Con AppInitializer Component

Envuelve tu app con el componente inicializador:

```tsx
// App.tsx o _layout.tsx
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { initDb, setCurrentUser } from './services/syncedDb';

export default function RootLayout() {
  const { user } = useUser();

  // Inicializar SQLite
  useEffect(() => {
    initDb()
      .then(() => console.log('✅ Database initialized'))
      .catch(err => console.error('❌ DB init error:', err));
  }, []);

  // Configurar usuario para Firebase sync
  useEffect(() => {
    if (user?.id) {
      setCurrentUser(user.id);
      console.log('✅ User configured for sync:', user.id);
    }
  }, [user?.id]);

  return (
    // Tu app aquí
  );
}
```

### Opción B: Hook Personalizado

```tsx
// hooks/useAppInit.ts
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { initDb, setCurrentUser } from '../services/syncedDb';

export function useAppInit() {
  const { user } = useUser();

  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  useEffect(() => {
    if (user?.id) setCurrentUser(user.id);
  }, [user?.id]);
}

// Luego en App.tsx
import { useAppInit } from './hooks/useAppInit';

export default function App() {
  useAppInit();
  return <YourApp />;
}
```

## 💡 Paso 5: Usar en Componentes

### Ejemplo: Lista de Journals

```tsx
import { useJournals } from '@/hooks/useDatabase';

export function JournalsScreen() {
  const {
    journals,
    loading,
    error,
    createJournal,
    deleteJournal,
  } = useJournals();

  const handleCreate = async () => {
    await createJournal('Mi Diario', '#FF6B6B');
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View>
      <Button title="Crear" onPress={handleCreate} />
      {journals.map(j => (
        <Text key={j.id}>{j.name}</Text>
      ))}
    </View>
  );
}
```

### Ejemplo: Tareas

```tsx
import { useTasks } from '@/hooks/useDatabase';

export function TasksScreen() {
  const {
    tasks,
    createTask,
    toggleCompletion,
  } = useTasks();

  return (
    <View>
      <Button
        title="Nueva Tarea"
        onPress={() => createTask('Hacer algo')}
      />
      {tasks.map(task => (
        <TouchableOpacity
          key={task.id}
          onPress={() => toggleCompletion(task.id, !task.is_completed)}
        >
          <Text>{task.is_completed ? '✅' : '⬜'} {task.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## 🔄 Paso 6: Sincronización

### Sincronización Automática

Por defecto, cada operación de escritura se sincroniza automáticamente:

```tsx
// Esto guarda en SQLite Y sincroniza con Firebase automáticamente
await createJournal('Mi Diario', '#FF6B6B');
```

### Sincronización Manual

```tsx
import { syncAllToFirebase, useSyncStatus } from '@/services/syncedDb';

function SyncButton() {
  const { syncAll, isSyncing, queueSize } = useSyncStatus();

  return (
    <Button
      title={isSyncing ? 'Sincronizando...' : `Sync (${queueSize})`}
      onPress={() => syncAll()}
      disabled={isSyncing}
    />
  );
}
```

### Deshabilitar Sync Temporalmente

```tsx
import { disableSync, enableSync } from '@/services/syncedDb';

// Para operaciones batch
disableSync();
for (let i = 0; i < 100; i++) {
  await createTask(`Task ${i}`);
}
enableSync();

// Ahora sincronizar todo de una vez
await syncAllToFirebase();
```

## 🎨 Paso 7: Migrar Código Existente

Si ya tenías código usando otra base de datos:

### Antes:
```tsx
import { db } from './config/FirebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Solo Firebase, no funciona offline
await addDoc(collection(db, 'journals'), {
  name: 'Mi Diario',
  color: '#FF6B6B'
});
```

### Después:
```tsx
import { createJournal } from './services/syncedDb';

// Funciona offline, sincroniza automáticamente
await createJournal('Mi Diario', '#FF6B6B');
```

## 📱 Estructura de Datos en Firebase

Los datos se organizan por usuario:

```
Firestore:
users/
  {userId}/
    journals/
      {journalId}/
        - id, name, color, is_favorite, created_at, updated_at

    pages/
      {pageId}/
        - id, journal_id, page_number, bg_color, created_at, updated_at

    page_texts/
      {textId}/
        - id, page_id, content, font_family, color, position_x, position_y, ...

    page_shapes/
      {shapeId}/
        - id, page_id, shape_type, color, position_x, position_y, width, height, ...

    page_draws/
      {drawId}/
        - id, page_id, path_d, color, width, opacity, tool, order_index, ...

    page_stickers/
      {stickerId}/
        - id, page_id, sticker_url, sticker_category, position_x, position_y, ...

    tasks/
      {taskId}/
        - id, title, is_completed, created_at, updated_at
```

## 🔒 Reglas de Seguridad Firebase

Añade estas reglas en Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuario solo puede acceder a sus datos
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Paso 8: Probar

### 1. Probar SQLite Local

```tsx
import { initDb, createJournal, listJournals } from './services/syncedDb';

async function testLocal() {
  await initDb();

  const { id } = await createJournal('Test', '#FF0000');
  console.log('Created:', id);

  const journals = await listJournals();
  console.log('Journals:', journals);
}
```

### 2. Probar Sincronización

```tsx
import { setCurrentUser, createJournal, syncAllToFirebase } from './services/syncedDb';

async function testSync() {
  setCurrentUser('test-user-123');

  await createJournal('Test Sync', '#00FF00');
  await syncAllToFirebase();

  console.log('✅ Check Firebase Console for data!');
}
```

### 3. Probar Offline

```tsx
// 1. Activa modo avión
// 2. Crea journals/tasks
// 3. Desactiva modo avión
// 4. Los datos se sincronizarán automáticamente
```

## 🐛 Troubleshooting

### Error: "User not authenticated"

```tsx
// Asegúrate de llamar setCurrentUser después del login
import { setCurrentUser } from './services/syncedDb';

const { user } = useUser();
useEffect(() => {
  if (user?.id) {
    setCurrentUser(user.id);
  }
}, [user?.id]);
```

### Error: "expo-sqlite no disponible"

```bash
npx expo install expo-sqlite
```

### Los datos no se sincronizan

1. Verifica la consola para errores de Firebase
2. Verifica que `setCurrentUser()` haya sido llamado
3. Revisa las reglas de seguridad de Firestore
4. Verifica la conexión a internet

### Quiero ver logs de sincronización

Abre la consola de tu app, verás:
```
✅ Database initialized
✅ User configured for sync: abc123
Sync failed (continuing offline): Error...
```

## 📚 Recursos Adicionales

- [Documentación completa](./services/README.md)
- [Ejemplos de uso](./examples/DatabaseUsageExample.tsx)
- [API Reference](./services/syncedDb.ts)
- [Hooks personalizados](./hooks/useDatabase.ts)

## ✅ Checklist Final

- [ ] Dependencias instaladas (`expo-sqlite`, `expo-crypto`)
- [ ] Firebase configurado en `config/FirebaseConfig.js`
- [ ] `initDb()` llamado al inicio de la app
- [ ] `setCurrentUser(userId)` llamado después del login
- [ ] Reglas de seguridad configuradas en Firebase
- [ ] Código migrado a usar `syncedDb.ts`
- [ ] Probado offline y online

## 🎉 ¡Listo!

Ahora tienes:
- ✅ Almacenamiento local con SQLite (funciona offline)
- ✅ Sincronización automática con Firebase
- ✅ Hooks de React listos para usar
- ✅ Manejo de errores y estado de carga
- ✅ Cola offline para sincronización posterior

¡Disfruta tu base de datos sincronizada!
