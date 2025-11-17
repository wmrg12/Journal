# SQLite + Firebase Integration

Este directorio contiene la integración completa entre SQLite (almacenamiento local) y Firebase Firestore (sincronización en la nube).

## Arquitectura

```
┌─────────────────┐
│   Tu App (UI)   │
└────────┬────────┘
         │
         ├─ Import from syncedDb.ts
         │
         v
┌─────────────────┐      ┌──────────────────┐
│  syncedDb.ts    │─────>│ firebaseSync.ts  │
│  (Wrappers)     │      │ (Sync Engine)    │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         v                        v
┌─────────────────┐      ┌──────────────────┐
│    db.ts        │      │    Firebase      │
│  (SQLite DAO)   │      │   (Firestore)    │
└─────────────────┘      └──────────────────┘
```

## Archivos

- **db.ts**: Funciones de acceso a datos SQLite local (DAO)
- **firebaseSync.ts**: Servicio de sincronización con Firebase
- **syncedDb.ts**: API unificada que combina ambos (USA ESTE)

## Cómo usar

### 1. Instalación de dependencias

```bash
npx expo install expo-sqlite expo-crypto
```

### 2. Inicialización

En tu archivo principal (App.tsx o _layout.tsx):

```typescript
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo'; // o tu sistema de auth
import { initDb, setCurrentUser } from './services/syncedDb';

export default function App() {
  const { user } = useUser();

  useEffect(() => {
    // Inicializar base de datos local
    initDb().then(() => {
      console.log('Database initialized');
    });
  }, []);

  useEffect(() => {
    // Configurar usuario para sincronización
    if (user?.id) {
      setCurrentUser(user.id);
    }
  }, [user?.id]);

  return <YourAppContent />;
}
```

### 3. Usar en componentes

```typescript
import {
  createJournal,
  listJournals,
  createPage,
  createPageText,
  syncAllToFirebase,
} from '@/services/syncedDb';

export default function JournalsScreen() {
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    // Cargar journals locales
    loadJournals();

    // Sincronizar con Firebase
    syncAllToFirebase().catch(console.error);
  }, []);

  async function loadJournals() {
    const data = await listJournals();
    setJournals(data);
  }

  async function handleCreateJournal() {
    // Esto guarda en SQLite Y sincroniza con Firebase automáticamente
    await createJournal('Mi Diario', '#FF6B6B');
    await loadJournals();
  }

  return (
    <View>
      <Button title="Crear Diario" onPress={handleCreateJournal} />
      {journals.map(journal => (
        <Text key={journal.id}>{journal.name}</Text>
      ))}
    </View>
  );
}
```

### 4. Listeners en tiempo real (opcional)

```typescript
import { useEffect, useState } from 'react';
import { listenToJournals } from '@/services/syncedDb';

export default function JournalsScreen() {
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    // Escuchar cambios en tiempo real desde Firebase
    const unsubscribe = listenToJournals((firebaseJournals) => {
      console.log('Journals updated from Firebase:', firebaseJournals);
      // Aquí podrías actualizar el estado local
    });

    return () => unsubscribe();
  }, []);

  // ...
}
```

## API Completa

### Journals

```typescript
// Crear diario
const { id } = await createJournal('Nombre', '#FF6B6B');

// Listar diarios
const journals = await listJournals();

// Actualizar portada
await updateJournalCover(journalId, {
  name: 'Nuevo nombre',
  color: '#00FF00',
});

// Marcar como favorito
await toggleFavorite(journalId, true);

// Eliminar diario
await deleteJournal(journalId);
```

### Pages

```typescript
// Crear página
const { pageNumber, total } = await createPage(journalId, '#FFFFFF');

// Obtener total de páginas
const total = await getTotalPages(journalId);

// Obtener ID de página
const pageId = await getPageId(journalId, pageNumber);

// Obtener color de fondo
const bgColor = await getPageColor(journalId, pageNumber);

// Eliminar página
await deletePage(journalId, pageNumber);
```

### Page Texts

```typescript
// Crear texto
const { id } = await createPageText(
  pageId,
  'Hola mundo',
  'Arial',
  '#000000',
  100, // x
  200, // y
  16, // fontSize
  0, // rotation
  0 // isLocked
);

// Listar textos
const texts = await listPageTexts(pageId);

// Actualizar texto
await updatePageText(textId, {
  content: 'Nuevo texto',
  position_x: 150,
  position_y: 250,
});

// Eliminar texto
await deletePageText(textId);
```

### Page Shapes

```typescript
// Crear forma
const { id } = await createPageShape(
  pageId,
  'circle', // shapeType
  '#FF0000',
  100, // x
  100, // y
  50, // width
  50 // height
);

// Listar formas
const shapes = await listPageShapes(pageId);

// Actualizar forma
await updatePageShape(shapeId, {
  color: '#00FF00',
  position_x: 200,
  rotation: 45,
});

// Eliminar forma
await deletePageShape(shapeId);
```

### Page Draws

```typescript
// Crear trazo
const { id, order_index } = await createPageDraw(
  pageId,
  'M 0 0 L 100 100', // SVG path
  '#000000',
  2, // width
  1, // opacity
  'pen' // tool
);

// Listar trazos
const draws = await listPageDraws(pageId);

// Eliminar trazo
await deletePageDraw(drawId);
```

### Page Stickers

```typescript
// Crear sticker
const { id } = await createPageSticker(
  pageId,
  'https://example.com/sticker.png',
  'emoji',
  100, // x
  100, // y
  80, // width
  80 // height
);

// Listar stickers
const stickers = await listPageStickers(pageId);

// Actualizar sticker
await updatePageSticker(stickerId, {
  position_x: 200,
  rotation: 30,
  is_locked: 1,
});

// Duplicar sticker
const { id: newId } = await duplicatePageSticker(stickerId);

// Bloquear/desbloquear
await toggleStickerLock(stickerId, true);

// Eliminar sticker
await deletePageSticker(stickerId);
```

### Tasks

```typescript
// Crear tarea
const { id } = await createTask('Hacer algo');

// Listar tareas
const tasks = await listTasks();

// Actualizar tarea
await updateTask(taskId, {
  title: 'Nuevo título',
  is_completed: true,
});

// Marcar como completada
await toggleTaskCompletion(taskId, true);

// Eliminar tarea
await deleteTask(taskId);
```

### Sincronización

```typescript
// Sincronizar todo a Firebase
await syncAllToFirebase();

// Sincronizar una página completa
await syncPageToFirebase(journalId, pageNumber);

// Obtener snapshot de página (sin sincronizar)
const snapshot = await getPageSnapshot(journalId, pageNumber);
// snapshot contiene: { page_id, journal_id, page_number, bg_color, texts, shapes, draws, stickers }

// Procesar cola offline
await processOfflineQueue();

// Ver tamaño de la cola
const pendingOps = getOfflineQueueSize();
```

### Control de sincronización

```typescript
import { enableSync, disableSync } from '@/services/syncedDb';

// Deshabilitar sincronización temporalmente
disableSync();

// ... hacer operaciones solo locales ...

// Re-habilitar sincronización
enableSync();
```

## Estrategia Offline-First

1. **Escritura**: Todas las operaciones se guardan primero en SQLite local
2. **Sincronización**: Luego se sincronizan con Firebase en segundo plano
3. **Errores de red**: Si falla la sincronización, los datos permanecen en SQLite
4. **Lectura**: Siempre se lee desde SQLite (rápido)

## Estructura de datos en Firebase

```
users/
  {userId}/
    journals/
      {journalId}/
        - id
        - name
        - color
        - is_favorite
        - created_at
        - updated_at
        - synced_at

    pages/
      {pageId}/
        - id
        - journal_id
        - page_number
        - bg_color
        - created_at
        - updated_at
        - synced_at

    page_texts/
      {textId}/
        - id
        - page_id
        - content
        - font_family
        - color
        - position_x
        - position_y
        - font_size
        - rotation
        - is_locked
        - created_at
        - updated_at
        - synced_at

    page_shapes/
      {shapeId}/
        - ...

    page_draws/
      {drawId}/
        - ...

    page_stickers/
      {stickerId}/
        - ...

    tasks/
      {taskId}/
        - ...
```

## Próximos pasos

1. ✅ SQLite setup
2. ✅ Firebase integration
3. ✅ Offline-first wrappers
4. 🔲 Resolución de conflictos (last-write-wins implementado)
5. 🔲 Sincronización periódica automática
6. 🔲 Indicador de estado de sincronización en UI
7. 🔲 Manejo de eliminaciones en cascada

## Troubleshooting

### Error: "User not authenticated"

Asegúrate de llamar `setCurrentUser(userId)` después de que el usuario inicie sesión:

```typescript
import { setCurrentUser } from '@/services/syncedDb';

// Después del login
setCurrentUser(user.id);
```

### Los datos no se sincronizan

1. Verifica que tengas conexión a internet
2. Verifica que Firebase esté configurado correctamente
3. Revisa la consola para errores
4. Verifica que `setCurrentUser()` haya sido llamado

### Quiero deshabilitar Firebase temporalmente

```typescript
import { disableSync } from '@/services/syncedDb';
disableSync();
```

## Ejemplos completos

Ver ejemplos en:
- `/examples/JournalExample.tsx` (por crear)
- `/examples/PageExample.tsx` (por crear)
