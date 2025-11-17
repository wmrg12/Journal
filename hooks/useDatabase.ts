/**
 * Custom hooks para usar la base de datos sincronizada en componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import * as DB from '../services/syncedDb';

// ==================== JOURNALS ====================

export function useJournals() {
  const [journals, setJournals] = useState<DB.Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadJournals = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DB.listJournals();
      setJournals(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  const createJournal = useCallback(async (name: string, color: string) => {
    try {
      const result = await DB.createJournal(name, color);
      await loadJournals();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadJournals]);

  const updateJournal = useCallback(async (
    journalId: string,
    updates: { name?: string; color?: string }
  ) => {
    try {
      await DB.updateJournalCover(journalId, updates);
      await loadJournals();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadJournals]);

  const toggleFavorite = useCallback(async (journalId: string, favorite: boolean) => {
    try {
      await DB.toggleFavorite(journalId, favorite);
      await loadJournals();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadJournals]);

  const deleteJournal = useCallback(async (journalId: string) => {
    try {
      await DB.deleteJournal(journalId);
      await loadJournals();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadJournals]);

  return {
    journals,
    loading,
    error,
    refresh: loadJournals,
    createJournal,
    updateJournal,
    toggleFavorite,
    deleteJournal,
  };
}

// ==================== PAGES ====================

export function usePages(journalId: string) {
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTotalPages = useCallback(async () => {
    try {
      setLoading(true);
      const total = await DB.getTotalPages(journalId);
      setTotalPages(total);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [journalId]);

  useEffect(() => {
    loadTotalPages();
  }, [loadTotalPages]);

  const createPage = useCallback(async (bgColor: string) => {
    try {
      const result = await DB.createPage(journalId, bgColor);
      await loadTotalPages();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [journalId, loadTotalPages]);

  const deletePage = useCallback(async (pageNumber: number) => {
    try {
      const result = await DB.deletePage(journalId, pageNumber);
      await loadTotalPages();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [journalId, loadTotalPages]);

  return {
    totalPages,
    loading,
    error,
    refresh: loadTotalPages,
    createPage,
    deletePage,
  };
}

// ==================== PAGE CONTENT ====================

export function usePage(journalId: string, pageNumber: number) {
  const [snapshot, setSnapshot] = useState<DB.PageSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DB.getPageSnapshot(journalId, pageNumber);
      setSnapshot(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [journalId, pageNumber]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  return {
    snapshot,
    loading,
    error,
    refresh: loadPage,
  };
}

// ==================== PAGE TEXTS ====================

export function usePageTexts(pageId: string | null) {
  const [texts, setTexts] = useState<DB.PageText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTexts = useCallback(async () => {
    if (!pageId) {
      setTexts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await DB.listPageTexts(pageId);
      setTexts(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadTexts();
  }, [loadTexts]);

  const createText = useCallback(async (
    content: string,
    fontFamily: string,
    color: string,
    positionX: number,
    positionY: number,
    fontSize?: number,
    rotation?: number,
    isLocked?: number
  ) => {
    if (!pageId) throw new Error('Page ID is required');

    try {
      const result = await DB.createPageText(
        pageId,
        content,
        fontFamily,
        color,
        positionX,
        positionY,
        fontSize,
        rotation,
        isLocked
      );
      await loadTexts();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [pageId, loadTexts]);

  const updateText = useCallback(async (
    textId: string,
    updates: Partial<Omit<DB.PageText, 'id' | 'page_id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      await DB.updatePageText(textId, updates);
      await loadTexts();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadTexts]);

  const deleteText = useCallback(async (textId: string) => {
    try {
      await DB.deletePageText(textId);
      await loadTexts();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadTexts]);

  return {
    texts,
    loading,
    error,
    refresh: loadTexts,
    createText,
    updateText,
    deleteText,
  };
}

// ==================== PAGE SHAPES ====================

export function usePageShapes(pageId: string | null) {
  const [shapes, setShapes] = useState<DB.PageShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadShapes = useCallback(async () => {
    if (!pageId) {
      setShapes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await DB.listPageShapes(pageId);
      setShapes(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadShapes();
  }, [loadShapes]);

  const createShape = useCallback(async (
    shapeType: DB.ShapeType,
    color: string,
    positionX: number,
    positionY: number,
    width?: number,
    height?: number
  ) => {
    if (!pageId) throw new Error('Page ID is required');

    try {
      const result = await DB.createPageShape(
        pageId,
        shapeType,
        color,
        positionX,
        positionY,
        width,
        height
      );
      await loadShapes();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [pageId, loadShapes]);

  const updateShape = useCallback(async (
    shapeId: string,
    updates: Partial<Omit<DB.PageShape, 'id' | 'page_id' | 'shape_type' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      await DB.updatePageShape(shapeId, updates);
      await loadShapes();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadShapes]);

  const deleteShape = useCallback(async (shapeId: string) => {
    try {
      await DB.deletePageShape(shapeId);
      await loadShapes();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadShapes]);

  return {
    shapes,
    loading,
    error,
    refresh: loadShapes,
    createShape,
    updateShape,
    deleteShape,
  };
}

// ==================== PAGE DRAWS ====================

export function usePageDraws(pageId: string | null) {
  const [draws, setDraws] = useState<DB.PageDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDraws = useCallback(async () => {
    if (!pageId) {
      setDraws([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await DB.listPageDraws(pageId);
      setDraws(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  const createDraw = useCallback(async (
    pathD: string,
    color: string,
    width: number,
    opacity: number,
    tool: 'pencil' | 'pen' | 'marker',
    orderIndex?: number
  ) => {
    if (!pageId) throw new Error('Page ID is required');

    try {
      const result = await DB.createPageDraw(
        pageId,
        pathD,
        color,
        width,
        opacity,
        tool,
        orderIndex
      );
      await loadDraws();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [pageId, loadDraws]);

  const deleteDraw = useCallback(async (drawId: string) => {
    try {
      await DB.deletePageDraw(drawId);
      await loadDraws();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadDraws]);

  return {
    draws,
    loading,
    error,
    refresh: loadDraws,
    createDraw,
    deleteDraw,
  };
}

// ==================== PAGE STICKERS ====================

export function usePageStickers(pageId: string | null) {
  const [stickers, setStickers] = useState<DB.PageSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadStickers = useCallback(async () => {
    if (!pageId) {
      setStickers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await DB.listPageStickers(pageId);
      setStickers(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadStickers();
  }, [loadStickers]);

  const createSticker = useCallback(async (
    stickerUrl: string,
    stickerCategory: string,
    positionX: number,
    positionY: number,
    width?: number,
    height?: number
  ) => {
    if (!pageId) throw new Error('Page ID is required');

    try {
      const result = await DB.createPageSticker(
        pageId,
        stickerUrl,
        stickerCategory,
        positionX,
        positionY,
        width,
        height
      );
      await loadStickers();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [pageId, loadStickers]);

  const updateSticker = useCallback(async (
    stickerId: string,
    updates: Partial<Omit<DB.PageSticker, 'id' | 'page_id' | 'sticker_url' | 'sticker_category' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      await DB.updatePageSticker(stickerId, updates);
      await loadStickers();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadStickers]);

  const duplicateSticker = useCallback(async (stickerId: string) => {
    try {
      const result = await DB.duplicatePageSticker(stickerId);
      await loadStickers();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadStickers]);

  const toggleLock = useCallback(async (stickerId: string, locked: boolean) => {
    try {
      await DB.toggleStickerLock(stickerId, locked);
      await loadStickers();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadStickers]);

  const deleteSticker = useCallback(async (stickerId: string) => {
    try {
      await DB.deletePageSticker(stickerId);
      await loadStickers();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadStickers]);

  return {
    stickers,
    loading,
    error,
    refresh: loadStickers,
    createSticker,
    updateSticker,
    duplicateSticker,
    toggleLock,
    deleteSticker,
  };
}

// ==================== TASKS ====================

export function useTasks() {
  const [tasks, setTasks] = useState<DB.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await DB.listTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (title: string) => {
    try {
      const result = await DB.createTask(title);
      await loadTasks();
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadTasks]);

  const updateTask = useCallback(async (
    taskId: string,
    updates: { title?: string; is_completed?: boolean }
  ) => {
    try {
      await DB.updateTask(taskId, updates);
      await loadTasks();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadTasks]);

  const toggleCompletion = useCallback(async (taskId: string, completed: boolean) => {
    try {
      await DB.toggleTaskCompletion(taskId, completed);
      await loadTasks();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadTasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await DB.deleteTask(taskId);
      await loadTasks();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    refresh: loadTasks,
    createTask,
    updateTask,
    toggleCompletion,
    deleteTask,
  };
}

// ==================== SYNC STATUS ====================

export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const syncAll = useCallback(async () => {
    try {
      setIsSyncing(true);
      await DB.syncAllToFirebase();
      setQueueSize(DB.getOfflineQueueSize());
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const processQueue = useCallback(async () => {
    try {
      setIsSyncing(true);
      await DB.processOfflineQueue();
      setQueueSize(DB.getOfflineQueueSize());
      setError(null);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Update queue size periodically
    const interval = setInterval(() => {
      setQueueSize(DB.getOfflineQueueSize());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isSyncing,
    queueSize,
    error,
    syncAll,
    processQueue,
  };
}
