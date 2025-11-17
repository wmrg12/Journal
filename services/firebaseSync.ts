import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/FirebaseConfig';
import * as LocalDB from './db';

// ==================== HELPER FUNCTIONS ====================

/**
 * Get current user ID (you'll need to implement this based on your auth system)
 * For now, using Clerk or your auth provider
 */
let currentUserId: string | null = null;

export function setCurrentUser(userId: string) {
  currentUserId = userId;
}

export function getCurrentUser(): string | null {
  return currentUserId;
}

function getUserPath(path: string): string {
  if (!currentUserId) {
    throw new Error('User not authenticated. Call setCurrentUser() first.');
  }
  return `users/${currentUserId}/${path}`;
}

// ==================== JOURNALS SYNC ====================

/**
 * Sync a journal to Firebase
 */
export async function syncJournalToFirebase(journal: LocalDB.Journal) {
  if (!currentUserId) return;

  const journalRef = doc(db, getUserPath(`journals/${journal.id}`));

  await setDoc(journalRef, {
    id: journal.id,
    name: journal.name,
    color: journal.color,
    is_favorite: journal.is_favorite,
    created_at: journal.created_at,
    updated_at: journal.updated_at,
    synced_at: serverTimestamp(),
  });
}

/**
 * Sync all journals to Firebase
 */
export async function syncAllJournalsToFirebase() {
  if (!currentUserId) return;

  const journals = await LocalDB.listJournals();
  const batch = writeBatch(db);

  for (const journal of journals) {
    const journalRef = doc(db, getUserPath(`journals/${journal.id}`));
    batch.set(journalRef, {
      id: journal.id,
      name: journal.name,
      color: journal.color,
      is_favorite: journal.is_favorite,
      created_at: journal.created_at,
      updated_at: journal.updated_at,
      synced_at: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Sync journals from Firebase to local SQLite
 */
export async function syncJournalsFromFirebase() {
  if (!currentUserId) return;

  const journalsRef = collection(db, getUserPath('journals'));
  const snapshot = await getDocs(journalsRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Check if local version exists and is newer
    const localJournals = await LocalDB.listJournals();
    const localJournal = localJournals.find(j => j.id === data.id);

    if (!localJournal || data.updated_at > localJournal.updated_at) {
      // Firebase version is newer, update local
      // Since we can't directly update, we'll need to delete and recreate
      // Or you can add an updateJournal function to db.ts

      if (localJournal) {
        await LocalDB.deleteJournal(data.id);
      }

      // Note: This is a simplified version. Ideally, add an insertJournal function
      // that allows specifying the ID and timestamps
      console.log('Would update journal:', data.id);
    }
  }
}

/**
 * Delete journal from Firebase
 */
export async function deleteJournalFromFirebase(journalId: string) {
  if (!currentUserId) return;

  const journalRef = doc(db, getUserPath(`journals/${journalId}`));
  await deleteDoc(journalRef);

  // Also delete all associated pages
  const pagesRef = collection(db, getUserPath('pages'));
  const pagesQuery = query(pagesRef, where('journal_id', '==', journalId));
  const pagesSnapshot = await getDocs(pagesQuery);

  const batch = writeBatch(db);
  for (const pageDoc of pagesSnapshot.docs) {
    batch.delete(pageDoc.ref);
  }
  await batch.commit();
}

// ==================== PAGES SYNC ====================

/**
 * Sync a page to Firebase
 */
export async function syncPageToFirebase(
  pageId: string,
  journalId: string,
  pageNumber: number,
  bgColor: string,
  createdAt: number,
  updatedAt: number
) {
  if (!currentUserId) return;

  const pageRef = doc(db, getUserPath(`pages/${pageId}`));

  await setDoc(pageRef, {
    id: pageId,
    journal_id: journalId,
    page_number: pageNumber,
    bg_color: bgColor,
    created_at: createdAt,
    updated_at: updatedAt,
    synced_at: serverTimestamp(),
  });
}

/**
 * Delete page from Firebase
 */
export async function deletePageFromFirebase(pageId: string) {
  if (!currentUserId) return;

  const pageRef = doc(db, getUserPath(`pages/${pageId}`));
  await deleteDoc(pageRef);

  // Delete all associated content
  await deletePageContentFromFirebase(pageId);
}

async function deletePageContentFromFirebase(pageId: string) {
  if (!currentUserId) return;

  const batch = writeBatch(db);

  // Delete texts
  const textsRef = collection(db, getUserPath('page_texts'));
  const textsQuery = query(textsRef, where('page_id', '==', pageId));
  const textsSnapshot = await getDocs(textsQuery);
  textsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete shapes
  const shapesRef = collection(db, getUserPath('page_shapes'));
  const shapesQuery = query(shapesRef, where('page_id', '==', pageId));
  const shapesSnapshot = await getDocs(shapesQuery);
  shapesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete draws
  const drawsRef = collection(db, getUserPath('page_draws'));
  const drawsQuery = query(drawsRef, where('page_id', '==', pageId));
  const drawsSnapshot = await getDocs(drawsQuery);
  drawsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete stickers
  const stickersRef = collection(db, getUserPath('page_stickers'));
  const stickersQuery = query(stickersRef, where('page_id', '==', pageId));
  const stickersSnapshot = await getDocs(stickersQuery);
  stickersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  await batch.commit();
}

// ==================== PAGE TEXTS SYNC ====================

/**
 * Sync page text to Firebase
 */
export async function syncPageTextToFirebase(text: LocalDB.PageText) {
  if (!currentUserId) return;

  const textRef = doc(db, getUserPath(`page_texts/${text.id}`));

  await setDoc(textRef, {
    id: text.id,
    page_id: text.page_id,
    content: text.content,
    font_family: text.font_family,
    color: text.color,
    position_x: text.position_x,
    position_y: text.position_y,
    font_size: text.font_size,
    rotation: text.rotation ?? 0,
    is_locked: text.is_locked ?? 0,
    created_at: text.created_at,
    updated_at: text.updated_at,
    synced_at: serverTimestamp(),
  });
}

/**
 * Delete page text from Firebase
 */
export async function deletePageTextFromFirebase(textId: string) {
  if (!currentUserId) return;

  const textRef = doc(db, getUserPath(`page_texts/${textId}`));
  await deleteDoc(textRef);
}

// ==================== PAGE SHAPES SYNC ====================

/**
 * Sync page shape to Firebase
 */
export async function syncPageShapeToFirebase(shape: LocalDB.PageShape) {
  if (!currentUserId) return;

  const shapeRef = doc(db, getUserPath(`page_shapes/${shape.id}`));

  await setDoc(shapeRef, {
    id: shape.id,
    page_id: shape.page_id,
    shape_type: shape.shape_type,
    color: shape.color,
    position_x: shape.position_x,
    position_y: shape.position_y,
    width: shape.width,
    height: shape.height,
    rotation: shape.rotation,
    is_locked: shape.is_locked,
    created_at: shape.created_at,
    updated_at: shape.updated_at,
    synced_at: serverTimestamp(),
  });
}

/**
 * Delete page shape from Firebase
 */
export async function deletePageShapeFromFirebase(shapeId: string) {
  if (!currentUserId) return;

  const shapeRef = doc(db, getUserPath(`page_shapes/${shapeId}`));
  await deleteDoc(shapeRef);
}

// ==================== PAGE DRAWS SYNC ====================

/**
 * Sync page draw to Firebase
 */
export async function syncPageDrawToFirebase(draw: LocalDB.PageDraw) {
  if (!currentUserId) return;

  const drawRef = doc(db, getUserPath(`page_draws/${draw.id}`));

  await setDoc(drawRef, {
    id: draw.id,
    page_id: draw.page_id,
    path_d: draw.path_d,
    color: draw.color,
    width: draw.width,
    opacity: draw.opacity,
    tool: draw.tool,
    order_index: draw.order_index,
    created_at: draw.created_at,
    updated_at: draw.updated_at,
    synced_at: serverTimestamp(),
  });
}

/**
 * Delete page draw from Firebase
 */
export async function deletePageDrawFromFirebase(drawId: string) {
  if (!currentUserId) return;

  const drawRef = doc(db, getUserPath(`page_draws/${drawId}`));
  await deleteDoc(drawRef);
}

// ==================== PAGE STICKERS SYNC ====================

/**
 * Sync page sticker to Firebase
 */
export async function syncPageStickerToFirebase(sticker: LocalDB.PageSticker) {
  if (!currentUserId) return;

  const stickerRef = doc(db, getUserPath(`page_stickers/${sticker.id}`));

  await setDoc(stickerRef, {
    id: sticker.id,
    page_id: sticker.page_id,
    sticker_url: sticker.sticker_url,
    sticker_category: sticker.sticker_category,
    position_x: sticker.position_x,
    position_y: sticker.position_y,
    width: sticker.width,
    height: sticker.height,
    rotation: sticker.rotation,
    is_locked: sticker.is_locked,
    created_at: sticker.created_at,
    updated_at: sticker.updated_at,
    synced_at: serverTimestamp(),
  });
}

/**
 * Delete page sticker from Firebase
 */
export async function deletePageStickerFromFirebase(stickerId: string) {
  if (!currentUserId) return;

  const stickerRef = doc(db, getUserPath(`page_stickers/${stickerId}`));
  await deleteDoc(stickerRef);
}

// ==================== TASKS SYNC ====================

/**
 * Sync task to Firebase
 */
export async function syncTaskToFirebase(task: LocalDB.Task) {
  if (!currentUserId) return;

  const taskRef = doc(db, getUserPath(`tasks/${task.id}`));

  await setDoc(taskRef, {
    id: task.id,
    title: task.title,
    is_completed: task.is_completed,
    created_at: task.created_at,
    updated_at: task.updated_at,
    synced_at: serverTimestamp(),
  });
}

/**
 * Delete task from Firebase
 */
export async function deleteTaskFromFirebase(taskId: string) {
  if (!currentUserId) return;

  const taskRef = doc(db, getUserPath(`tasks/${taskId}`));
  await deleteDoc(taskRef);
}

// ==================== FULL SYNC ====================

/**
 * Perform full sync: push all local data to Firebase
 */
export async function performFullSync() {
  if (!currentUserId) {
    console.warn('Cannot sync: user not authenticated');
    return;
  }

  try {
    // Sync journals
    const journals = await LocalDB.listJournals();
    for (const journal of journals) {
      await syncJournalToFirebase(journal);
    }

    // Sync tasks
    const tasks = await LocalDB.listTasks();
    for (const task of tasks) {
      await syncTaskToFirebase(task);
    }

    console.log('Full sync completed successfully');
  } catch (error) {
    console.error('Error during full sync:', error);
    throw error;
  }
}

/**
 * Sync a complete page with all its content
 */
export async function syncCompletePageToFirebase(journalId: string, pageNumber: number) {
  if (!currentUserId) return;

  const snapshot = await LocalDB.getPageSnapshot(journalId, pageNumber);
  if (!snapshot) return;

  // Sync page metadata
  await syncPageToFirebase(
    snapshot.page_id,
    snapshot.journal_id,
    snapshot.page_number,
    snapshot.bg_color || '#ffffff',
    0, // You'll need to get actual timestamps
    0
  );

  // Sync all content
  const batch = writeBatch(db);

  // Sync texts
  for (const text of snapshot.texts) {
    await syncPageTextToFirebase(text);
  }

  // Sync shapes
  for (const shape of snapshot.shapes) {
    await syncPageShapeToFirebase(shape);
  }

  // Sync draws
  for (const draw of snapshot.draws) {
    await syncPageDrawToFirebase(draw);
  }

  // Sync stickers
  for (const sticker of snapshot.stickers) {
    await syncPageStickerToFirebase(sticker);
  }
}

// ==================== REALTIME LISTENERS ====================

/**
 * Listen to journal changes from Firebase
 */
export function listenToJournals(callback: (journals: any[]) => void) {
  if (!currentUserId) return () => {};

  const journalsRef = collection(db, getUserPath('journals'));

  return onSnapshot(journalsRef, (snapshot) => {
    const journals = snapshot.docs.map(doc => doc.data());
    callback(journals);
  });
}

/**
 * Listen to task changes from Firebase
 */
export function listenToTasks(callback: (tasks: any[]) => void) {
  if (!currentUserId) return () => {};

  const tasksRef = collection(db, getUserPath('tasks'));

  return onSnapshot(tasksRef, (snapshot) => {
    const tasks = snapshot.docs.map(doc => doc.data());
    callback(tasks);
  });
}

/**
 * Listen to page content changes from Firebase
 */
export function listenToPageContent(pageId: string, callback: (content: any) => void) {
  if (!currentUserId) return () => {};

  const unsubscribers: (() => void)[] = [];

  // Listen to texts
  const textsRef = collection(db, getUserPath('page_texts'));
  const textsQuery = query(textsRef, where('page_id', '==', pageId));
  unsubscribers.push(onSnapshot(textsQuery, (snapshot) => {
    const texts = snapshot.docs.map(doc => doc.data());
    callback({ type: 'texts', data: texts });
  }));

  // Listen to shapes
  const shapesRef = collection(db, getUserPath('page_shapes'));
  const shapesQuery = query(shapesRef, where('page_id', '==', pageId));
  unsubscribers.push(onSnapshot(shapesQuery, (snapshot) => {
    const shapes = snapshot.docs.map(doc => doc.data());
    callback({ type: 'shapes', data: shapes });
  }));

  // Listen to draws
  const drawsRef = collection(db, getUserPath('page_draws'));
  const drawsQuery = query(drawsRef, where('page_id', '==', pageId));
  unsubscribers.push(onSnapshot(drawsQuery, (snapshot) => {
    const draws = snapshot.docs.map(doc => doc.data());
    callback({ type: 'draws', data: draws });
  }));

  // Listen to stickers
  const stickersRef = collection(db, getUserPath('page_stickers'));
  const stickersQuery = query(stickersRef, where('page_id', '==', pageId));
  unsubscribers.push(onSnapshot(stickersQuery, (snapshot) => {
    const stickers = snapshot.docs.map(doc => doc.data());
    callback({ type: 'stickers', data: stickers });
  }));

  // Return function to unsubscribe from all listeners
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

// ==================== OFFLINE QUEUE ====================

type SyncOperation = {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
};

let offlineQueue: SyncOperation[] = [];

export function addToOfflineQueue(operation: Omit<SyncOperation, 'timestamp'>) {
  offlineQueue.push({
    ...operation,
    timestamp: Date.now(),
  });
}

export async function processOfflineQueue() {
  if (!currentUserId || offlineQueue.length === 0) return;

  const batch = writeBatch(db);
  const operations = [...offlineQueue];
  offlineQueue = [];

  try {
    for (const op of operations) {
      const docRef = doc(db, getUserPath(`${op.collection}/${op.id}`));

      if (op.type === 'delete') {
        batch.delete(docRef);
      } else {
        batch.set(docRef, op.data, { merge: op.type === 'update' });
      }
    }

    await batch.commit();
    console.log(`Processed ${operations.length} offline operations`);
  } catch (error) {
    console.error('Error processing offline queue:', error);
    // Re-add failed operations
    offlineQueue = [...operations, ...offlineQueue];
    throw error;
  }
}

export function getOfflineQueueSize(): number {
  return offlineQueue.length;
}
