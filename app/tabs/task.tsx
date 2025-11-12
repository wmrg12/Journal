import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Pressable,
  ScrollView,  
} from 'react-native';
import {
  createTask,
  listTasks,
  toggleTaskCompletion,
  deleteTask,
  Task,
} from "@/src/db/dao";
import { stylest } from "@/styles/taskStyles"; 
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TasksScreenProps {
  onClose?: () => void;
}

export default function TasksScreen({ onClose }: TasksScreenProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const loadedTasks = await listTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      Alert.alert('Error', 'No se pudieron cargar las tareas');
    }
  };

  const handleAddTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) {
      Alert.alert('Error', 'Por favor escribe un título para la tarea');
      return;
    }
    setLoading(true);
    try {
      await createTask(title);
      setNewTaskTitle('');
      setShowAddModal(false);
      await loadTasks();
    } catch (error) {
      console.error('Error creando tarea:', error);
      Alert.alert('Error', 'No se pudo crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newCompletedState = !task.is_completed;
      await toggleTaskCompletion(task.id, newCompletedState);
      await loadTasks();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  //Volver a pendiente
  const handleUncompleteTask = async (task: Task) => {
    try {
      await toggleTaskCompletion(task.id, false);
      await loadTasks();
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    }
  };

  // Eliminar tarea con confirmacion
  const confirmDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Eliminar tarea',
      '¿Estás seguro de que quieres eliminar esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              await loadTasks();
            } catch (error) {
              console.error('Error eliminando tarea:', error);
              Alert.alert('Error', 'No se pudo eliminar la tarea');
            }
          },
        },
      ]
    );
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  const renderPending = ({ item }: { item: Task }) => {
    const isCompleted = item.is_completed === 1;
    return (
      <Pressable
        onPress={() => handleToggleTask(item)}
        style={({ pressed }) => [stylest.card, stylest.cardPending, pressed && stylest.cardPressed]}
      >
        <View style={stylest.leftIcon}>
          <View style={[stylest.checkboxCircle, isCompleted && stylest.checkboxCircleChecked]}>
            {isCompleted && <Text style={stylest.checkmark}>✓</Text>}
          </View>
        </View>
        <Text style={stylest.cardText} numberOfLines={2}>{item.title}</Text>
      </Pressable>
    );
  };

  const renderCompleted = ({ item }: { item: Task }) => (
    <Pressable
      onPress={() => confirmDeleteTask(item.id)}
      style={({ pressed }) => [stylest.card, stylest.cardCompleted, pressed && stylest.cardPressed]}
    >
      <TouchableOpacity
        accessibilityLabel="Volver a pendiente"
        onPress={(e) => {
          e.stopPropagation();
          handleUncompleteTask(item);
        }}
        style={stylest.leftIcon}
        activeOpacity={0.7}
      >
        <View style={stylest.deleteCircle}>
          <Text style={stylest.deleteX}>✕</Text>
        </View>
      </TouchableOpacity>
      <Text style={stylest.cardText} numberOfLines={2}>{item.title}</Text>
    </Pressable>
  );

  return (
    <View style={[stylest.container, { paddingTop: insets.top - 20 }]}>

      {/* Header */}
      <View style={stylest.header}>
        <View>
          <Text style={stylest.title}>Tareas</Text>
          <Text style={stylest.subtitle}>por completar</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={stylest.addBtn}
          activeOpacity={0.8}
        >
          <Text style={stylest.addBtnText}>Añadir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={stylest.scroll}
        contentContainerStyle={[
          stylest.scrollContent,
          { paddingBottom: tabBarHeight + insets.bottom + 16 }  
        ]}
        scrollIndicatorInsets={{ bottom: tabBarHeight + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Lista de pendientes */}
        {pendingTasks.length > 0 ? (
          <View style={stylest.listBlock}>
            <FlatList
              data={pendingTasks}
              keyExtractor={(item) => item.id}
              renderItem={renderPending}
              ItemSeparatorComponent={() => <View style={stylest.separator} />}
              scrollEnabled={false}  
            />
          </View>
        ) : (
          <Text style={stylest.emptyText}>No hay tareas pendientes</Text>
        )}

        {/* Completadas */}
        {completedTasks.length > 0 && (
          <View style={stylest.completedBlock}>
            <Text style={stylest.sectionTitle}>completas</Text>
            <FlatList
              data={completedTasks}
              keyExtractor={(item) => item.id}
              renderItem={renderCompleted}
              ItemSeparatorComponent={() => <View style={stylest.separator} />}
              scrollEnabled={false} 
            />
          </View>
        )}
        <View style={{ height: tabBarHeight + insets.bottom }} />
      </ScrollView>

      {/* Modal Añadir */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <Pressable style={stylest.modalBackdrop} onPress={() => setShowAddModal(false)}>
          <Pressable style={stylest.modalCard} onPress={() => {}}>
            <View style={stylest.modalHeader}>
              <Text style={stylest.modalTitle}>Nueva Tarea</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={stylest.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={stylest.modalInput}
              placeholder="Escribe el título…"
              placeholderTextColor="#9A9A9A"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              returnKeyType="done"
              onSubmitEditing={handleAddTask}
              autoFocus
            />

            <TouchableOpacity
              onPress={handleAddTask}
              activeOpacity={0.85}
              style={[stylest.saveBtn, loading && { opacity: 0.7 }]}
              disabled={loading}
            >
              <Text style={stylest.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      </View>
  );
}