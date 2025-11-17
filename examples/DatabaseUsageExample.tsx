/**
 * Ejemplo completo de uso de la base de datos sincronizada
 *
 * Este archivo muestra cómo integrar SQLite + Firebase en tu app
 */

import React, { useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo'; // o tu sistema de auth
import { initDb, setCurrentUser } from '../services/syncedDb';
import { useJournals, useTasks, useSyncStatus } from '../hooks/useDatabase';

// ==================== INICIALIZACIÓN EN APP ROOT ====================

/**
 * Coloca esto en tu App.tsx o _layout.tsx
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  useEffect(() => {
    // Inicializar base de datos SQLite
    initDb().then(() => {
      console.log('✅ Database initialized');
    }).catch(err => {
      console.error('❌ Database init failed:', err);
    });
  }, []);

  useEffect(() => {
    // Configurar usuario para sincronización con Firebase
    if (user?.id) {
      setCurrentUser(user.id);
      console.log('✅ User set for sync:', user.id);
    }
  }, [user?.id]);

  return <>{children}</>;
}

// ==================== EJEMPLO: LISTA DE DIARIOS ====================

export function JournalsScreen() {
  const {
    journals,
    loading,
    error,
    refresh,
    createJournal,
    updateJournal,
    toggleFavorite,
    deleteJournal,
  } = useJournals();

  const { syncAll, isSyncing, queueSize } = useSyncStatus();

  // Sincronizar al cargar la pantalla
  useEffect(() => {
    syncAll().catch(console.error);
  }, []);

  const handleCreate = async () => {
    try {
      await createJournal('Mi Nuevo Diario', '#FF6B6B');
      console.log('✅ Journal created');
    } catch (err) {
      console.error('❌ Error creating journal:', err);
    }
  };

  const handleToggleFavorite = async (id: string, currentFavorite: number) => {
    try {
      await toggleFavorite(id, currentFavorite === 0);
      console.log('✅ Favorite toggled');
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournal(id);
      console.log('✅ Journal deleted');
    } catch (err) {
      console.error('❌ Error deleting journal:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Cargando diarios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error.message}</Text>
        <Button title="Reintentar" onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Diarios</Text>
        <Text style={styles.syncInfo}>
          {isSyncing ? '🔄 Sincronizando...' : '✅ Sincronizado'}
          {queueSize > 0 && ` (${queueSize} pendientes)`}
        </Text>
      </View>

      <Button title="➕ Crear Diario" onPress={handleCreate} />
      <Button
        title="🔄 Sincronizar con Firebase"
        onPress={() => syncAll()}
        disabled={isSyncing}
      />

      <FlatList
        data={journals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.journalItem}>
            <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
            <View style={styles.journalInfo}>
              <Text style={styles.journalName}>{item.name}</Text>
              <Text style={styles.journalDate}>
                Creado: {new Date(item.created_at * 1000).toLocaleDateString()}
              </Text>
            </View>
            <Button
              title={item.is_favorite ? '⭐' : '☆'}
              onPress={() => handleToggleFavorite(item.id, item.is_favorite)}
            />
            <Button
              title="🗑️"
              onPress={() => handleDelete(item.id)}
              color="red"
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay diarios. ¡Crea uno!</Text>
        }
      />
    </View>
  );
}

// ==================== EJEMPLO: LISTA DE TAREAS ====================

export function TasksScreen() {
  const {
    tasks,
    loading,
    error,
    createTask,
    toggleCompletion,
    deleteTask,
  } = useTasks();

  const handleCreate = async () => {
    try {
      await createTask('Nueva tarea');
      console.log('✅ Task created');
    } catch (err) {
      console.error('❌ Error creating task:', err);
    }
  };

  const handleToggle = async (id: string, currentStatus: number) => {
    try {
      await toggleCompletion(id, currentStatus === 0);
      console.log('✅ Task toggled');
    } catch (err) {
      console.error('❌ Error toggling task:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Tareas</Text>
      <Button title="➕ Nueva Tarea" onPress={handleCreate} />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Button
              title={item.is_completed ? '✅' : '⬜'}
              onPress={() => handleToggle(item.id, item.is_completed)}
            />
            <Text
              style={[
                styles.taskTitle,
                item.is_completed && styles.completedTask,
              ]}
            >
              {item.title}
            </Text>
            <Button
              title="🗑️"
              onPress={() => deleteTask(item.id)}
              color="red"
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay tareas</Text>
        }
      />
    </View>
  );
}

// ==================== EJEMPLO: PÁGINA CON ELEMENTOS ====================

export function PageEditorScreen({ journalId, pageNumber }: { journalId: string; pageNumber: number }) {
  const { snapshot, loading, error } = usePage(journalId, pageNumber);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !snapshot) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error cargando página</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Página {snapshot.page_number}</Text>
      <Text>Fondo: {snapshot.bg_color}</Text>

      <Text style={styles.sectionTitle}>Textos ({snapshot.texts.length})</Text>
      {snapshot.texts.map(text => (
        <Text key={text.id} style={{ color: text.color }}>
          {text.content}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Formas ({snapshot.shapes.length})</Text>
      {snapshot.shapes.map(shape => (
        <Text key={shape.id}>
          {shape.shape_type} - {shape.color}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Dibujos ({snapshot.draws.length})</Text>
      <Text>{snapshot.draws.length} trazos</Text>

      <Text style={styles.sectionTitle}>Stickers ({snapshot.stickers.length})</Text>
      {snapshot.stickers.map(sticker => (
        <Text key={sticker.id}>{sticker.sticker_category}</Text>
      ))}
    </View>
  );
}

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  syncInfo: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  journalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  colorBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  journalInfo: {
    flex: 1,
  },
  journalName: {
    fontSize: 16,
    fontWeight: '600',
  },
  journalDate: {
    fontSize: 12,
    color: '#666',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 16,
  },
});

// ==================== IMPORTAR EN TU APP ====================

/**
 * En tu App.tsx o _layout.tsx:
 *
 * import { AppInitializer } from './examples/DatabaseUsageExample';
 *
 * export default function App() {
 *   return (
 *     <AppInitializer>
 *       <NavigationContainer>
 *         <Stack.Navigator>
 *           <Stack.Screen name="Journals" component={JournalsScreen} />
 *           <Stack.Screen name="Tasks" component={TasksScreen} />
 *         </Stack.Navigator>
 *       </NavigationContainer>
 *     </AppInitializer>
 *   );
 * }
 */

/**
 * IMPORTANTE: Asegúrate de tener estas dependencias instaladas:
 *
 * npx expo install expo-sqlite expo-crypto
 * npm install firebase
 *
 * Y configurar Firebase en config/FirebaseConfig.js
 */
