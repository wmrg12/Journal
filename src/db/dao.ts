// src/db/dao.ts
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

let legacyDb: any = null;
let adb: any = null;
let isAsync = false;
let currentDbUserId: string | null = null;

// intbd solo se ejecuta una vez
let initPromise: Promise<void> | null = null;
let isInitialized = false;
let isInitializing = false;

export async function closeDatabase() {
  if (adb && isAsync) {
    try {
      console.log('Cerrando base de datos async...');
      await (adb as any).closeAsync?.();
      adb = null;
      console.log('Base de datos async cerrada');
    } catch (error) {
      console.error('Error cerrando BD async:', error);
    }
  } else if (legacyDb && !isAsync) {
    try {
      console.log('Cerrando base de datos legacy...');
      legacyDb = null;
      console.log('Base de datos legacy cerrada');
    } catch (error) {
      console.error('Error cerrando BD legacy:', error);
    }
  }

  // Resetear flags
  isInitialized = false;
  currentDbUserId = null;
  initPromise = null;
}

export async function initDb(userId?: string) {
  if (isInitialized && currentDbUserId === userId) {
    return;
  }

  if (isInitialized && currentDbUserId !== userId && userId) {
    console.log('Cambiando de base de datos de usuario...');
    await closeDatabase();
    isInitializing = true;
    initPromise = null;
  }

  if (initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = _initDbInternal(userId);

  try {
    await initPromise;
    isInitialized = true;
    isInitializing = false;
    currentDbUserId = userId || null;
  } catch (error) {
    initPromise = null;
    isInitializing = false;
    throw error;
  }
}

async function _initDbInternal(userId?: string) {
  const anySQLite = SQLite as any;

  const dbName = userId ? `journal_${userId}.db` : 'journal.db';
  console.log('Abriendo base de datos:', dbName);

  // -------- LEGACY (openDatabase) --------
  if (typeof anySQLite.openDatabase === 'function') {
    const newDb = anySQLite.openDatabase(dbName);
    isAsync = false;

    // PRAGMA FK
    await new Promise<void>((resolve) => {
      (newDb as any).exec?.([{ sql: 'PRAGMA foreign_keys = ON;', args: [] }], false, () =>
        resolve(),
      ) ?? resolve();
    });

    legacyDb = newDb;

    // Tablas sql
    await txLegacy(async (tx: any) => {
      // journals
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS journals(
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          is_favorite INTEGER NOT NULL DEFAULT 0 CHECK(is_favorite IN (0,1)),
          created_at INTEGER NOT NULL
        );`,
      );

      // pages
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS pages(
          id TEXT PRIMARY KEY NOT NULL,
          journal_id TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          bg_color TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
        );`,
      );

      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS tasks(
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );`,
      );
      // PagePatterns
      await execTxIgnore(tx, `ALTER TABLE pages ADD COLUMN pattern TEXT NOT NULL DEFAULT 'none'`);

      // Tabla para textos en páginas
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS page_texts(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          content TEXT NOT NULL,
          font_family TEXT NOT NULL,
          color TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          font_size INTEGER NOT NULL DEFAULT 16,
          rotation REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );`,
      );

      // Tabla para trazos de dibujo
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS page_draws(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          path_d TEXT NOT NULL,
          color TEXT NOT NULL,
          width REAL NOT NULL,
          opacity REAL NOT NULL,
          tool TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );`,
      );
      await execTx(tx, `CREATE INDEX IF NOT EXISTS idx_page_draws_page ON page_draws(page_id);`);

      // Tabla para formas geometricas
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS page_shapes(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          shape_type TEXT NOT NULL,
          color TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 100,
          height REAL NOT NULL DEFAULT 100,
          rotation REAL NOT NULL DEFAULT 0,
          is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );`,
      );
      await execTx(tx, `CREATE INDEX IF NOT EXISTS idx_page_shapes_page ON page_shapes(page_id);`);

      // Tabla para stickers
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS page_stickers(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          sticker_url TEXT NOT NULL,
          sticker_category TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 100,
          height REAL NOT NULL DEFAULT 100,
          rotation REAL NOT NULL DEFAULT 0,
          is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );`,
      );
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_page_stickers_page ON page_stickers(page_id);`,
      );

      // tabla para imagenes
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS page_images(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          uri TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 100,
          height REAL NOT NULL DEFAULT 100,
          rotation REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );`,
      );
      await execTx(tx, `CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_id);`);

      // Tabla para audios
      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS page_audios(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          audio_uri TEXT NOT NULL,
          audio_type TEXT NOT NULL CHECK(audio_type IN ('recording', 'file')),
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );`,
      );
      await execTx(tx, `CREATE INDEX IF NOT EXISTS idx_page_audios_page ON page_audios(page_id);`);

      // ---- MIGRACIONES ----
      await execTxIgnore(
        tx,
        `ALTER TABLE journals ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`,
      );
      await execTxIgnore(
        tx,
        `ALTER TABLE pages ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`,
      );
      await execTxIgnore(tx, `ALTER TABLE journals ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE pages ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE page_texts ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE page_draws ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE page_shapes ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE page_stickers ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE page_images ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE page_audios ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE tasks ADD COLUMN user_id TEXT`);
      await execTxIgnore(tx, `ALTER TABLE pages ADD COLUMN deleted_at INTEGER`);

      // En la sección de migraciones, agregar:
      await execTxIgnore(tx, `ALTER TABLE journals ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE tasks ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE page_texts ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE page_draws ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE page_shapes ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE page_stickers ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE page_images ADD COLUMN deleted_at INTEGER`);
await execTxIgnore(tx, `ALTER TABLE page_audios ADD COLUMN deleted_at INTEGER`);

      await execTxIgnore(
        tx,
        `ALTER TABLE page_texts ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1))`,
      );
      await execTxIgnore(tx, `ALTER TABLE page_texts ADD COLUMN rotation REAL NOT NULL DEFAULT 0`);
      await execTxIgnore(tx, `ALTER TABLE journals ADD COLUMN default_pattern TEXT`);
      await execTxIgnore(tx, `ALTER TABLE journals ADD COLUMN default_color TEXT`);

      // Migraciones para page_shapes
      await execTxIgnore(
        tx,
        `ALTER TABLE page_shapes ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0`,
      );
      await execTxIgnore(tx, `ALTER TABLE page_shapes ADD COLUMN rotation REAL NOT NULL DEFAULT 0`);
      await execTxIgnore(tx, `ALTER TABLE journals ADD COLUMN deleted_at INTEGER`);
      await execTx(tx, `CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`);
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_pages_journal_number ON pages(journal_id, page_number);`,
      );
      await execTx(
        tx,
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_pages_journal_number ON pages(journal_id, page_number);`,
      );

      // Indice para textos
      await execTx(tx, `CREATE INDEX IF NOT EXISTS idx_page_texts_page ON page_texts(page_id);`);
    });

    return;
  }

  // -------- ASYNC (openDatabaseAsync) --------
  if (typeof anySQLite.openDatabaseAsync === 'function') {
    const newAdb = await anySQLite.openDatabaseAsync(dbName);
    isAsync = true;
    adb = newAdb;

    try {
      await (newAdb as any).execAsync(`
        PRAGMA foreign_keys = ON;
        
        CREATE TABLE IF NOT EXISTS journals(
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          is_favorite INTEGER NOT NULL DEFAULT 0 CHECK(is_favorite IN (0,1)),
          created_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS pages(
          id TEXT PRIMARY KEY NOT NULL,
          journal_id TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          bg_color TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS tasks(
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS page_texts(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          content TEXT NOT NULL,
          font_family TEXT NOT NULL,
          color TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          font_size INTEGER NOT NULL DEFAULT 16,
          rotation REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        
        CREATE TABLE IF NOT EXISTS page_draws(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          path_d TEXT NOT NULL,
          color TEXT NOT NULL,
          width REAL NOT NULL,
          opacity REAL NOT NULL,
          tool TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_page_draws_page ON page_draws(page_id);
        
        CREATE TABLE IF NOT EXISTS page_shapes(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          shape_type TEXT NOT NULL,
          color TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 100,
          height REAL NOT NULL DEFAULT 100,
          rotation REAL NOT NULL DEFAULT 0,
          is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_page_shapes_page ON page_shapes(page_id);
        
        CREATE TABLE IF NOT EXISTS page_stickers(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          sticker_url TEXT NOT NULL,
          sticker_category TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 100,
          height REAL NOT NULL DEFAULT 100,
          rotation REAL NOT NULL DEFAULT 0,
          is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_page_stickers_page ON page_stickers(page_id);
        
        CREATE TABLE IF NOT EXISTS page_images(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          uri TEXT NOT NULL,
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          width REAL NOT NULL DEFAULT 100,
          height REAL NOT NULL DEFAULT 100,
          rotation REAL NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_id);
        
        CREATE TABLE IF NOT EXISTS page_audios(
          id TEXT PRIMARY KEY NOT NULL,
          page_id TEXT NOT NULL,
          audio_uri TEXT NOT NULL,
          audio_type TEXT NOT NULL CHECK(audio_type IN ('recording', 'file')),
          position_x REAL NOT NULL,
          position_y REAL NOT NULL,
          is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY(page_id) REFERENCES pages(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_page_audios_page ON page_audios(page_id);
        
        CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);
        CREATE INDEX IF NOT EXISTS idx_pages_journal_number ON pages(journal_id, page_number);
        CREATE UNIQUE INDEX IF NOT EXISTS ux_pages_journal_number ON pages(journal_id, page_number);
        CREATE INDEX IF NOT EXISTS idx_page_texts_page ON page_texts(page_id);
      `);

      // Ejecutar migraciones por separado 
      const migrations = [
        `ALTER TABLE journals ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`,
        `ALTER TABLE pages ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`,

        `ALTER TABLE journals ADD COLUMN user_id TEXT`,
        `ALTER TABLE pages ADD COLUMN user_id TEXT`,
        `ALTER TABLE page_texts ADD COLUMN user_id TEXT`,
        `ALTER TABLE page_draws ADD COLUMN user_id TEXT`,
        `ALTER TABLE page_shapes ADD COLUMN user_id TEXT`,
        `ALTER TABLE page_stickers ADD COLUMN user_id TEXT`,
        `ALTER TABLE page_images ADD COLUMN user_id TEXT`,
        `ALTER TABLE page_audios ADD COLUMN user_id TEXT`,
        `ALTER TABLE tasks ADD COLUMN user_id TEXT`,

        `ALTER TABLE page_texts ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1))`,
        `ALTER TABLE page_texts ADD COLUMN rotation REAL NOT NULL DEFAULT 0`,
        `ALTER TABLE page_shapes ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0`,
        `ALTER TABLE page_shapes ADD COLUMN rotation REAL NOT NULL DEFAULT 0`,

        `ALTER TABLE pages ADD COLUMN pattern TEXT NOT NULL DEFAULT 'none'`,
        `ALTER TABLE journals ADD COLUMN default_pattern TEXT`,
        `ALTER TABLE journals ADD COLUMN default_color TEXT`,

        // Campos deleted_at (todos)
        `ALTER TABLE journals ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE pages ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE tasks ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE page_texts ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE page_draws ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE page_shapes ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE page_stickers ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE page_images ADD COLUMN deleted_at INTEGER`,
        `ALTER TABLE page_audios ADD COLUMN deleted_at INTEGER`,

        `ALTER TABLE page_texts ADD COLUMN text_width`
      ];

      for (const migration of migrations) {
        try {
          await (newAdb as any).execAsync(migration);
        } catch (error) {}
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }

    return;
  }

  throw new Error('expo-sqlite no disponible. Instala: npx expo install expo-sqlite');
}

// ---------- Utilidades de ejecución ----------
function execTx(tx: any, sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.executeSql(
      sql,
      params,
      () => resolve(),
      (_tx: any, err: any) => {
        reject(err);
        return true;
      },
    );
  });
}

// Ignora errores
async function execTxIgnore(tx: any, sql: string, params: any[] = []) {
  try {
    await execTx(tx, sql, params);
  } catch {}
}

async function runAsync(sql: string, params: any[] = []): Promise<void> {
  if (!adb) throw new Error('DB async no inicializada');
  if (typeof (adb as any).runAsync === 'function') {
    await (adb as any).runAsync(sql, params);
  } else if (params.length === 0 && typeof (adb as any).execAsync === 'function') {
    await (adb as any).execAsync(sql);
  } else {
    throw new Error('Método runAsync/execAsync no disponible para consultas parametrizadas');
  }
}

async function runAsyncIgnore(sql: string, params: any[] = []): Promise<void> {
  try {
    await runAsync(sql, params);
  } catch {}
}

function txLegacy<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    (legacyDb as any).transaction(
      (tx: any) => {
        Promise.resolve(fn(tx)).catch((e) => {
          throw e;
        });
      },
      (err: any) => reject(err),
      () => resolve(undefined as unknown as T),
    );
  });
}

// ========== DAO: Journals ==========
export async function createJournal(name: string, color: string) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO journals(id, name, color, is_favorite, created_at, updated_at, default_pattern, default_color, user_id)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [id, name, color, 0, now, now, 'none', color, currentUserId],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO journals(id, name, color, is_favorite, created_at, updated_at, default_pattern, default_color, user_id)
         VALUES(?,?,?,?,?,?,?,?,?)`,
        [id, name, color, 0, now, now, 'none', color, currentUserId],
      );
    });
  }
  return { id };
}

export type Journal = {
  id: string;
  name: string;
  color: string;
  is_favorite: number;
  created_at: number;
  updated_at: number;
};

export async function listJournals(): Promise<Journal[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, name, color, is_favorite, created_at, updated_at
         FROM journals
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC`,
    );
    return rows ?? [];
  }

  return new Promise<Journal[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, name, color, is_favorite, created_at, updated_at
           FROM journals
           WHERE deleted_at IS NULL
           ORDER BY created_at DESC`,
        [],
        (_: any, res: any) => {
          const out: Journal[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

// Lista todos incluyendo eliminados
export async function listAllJournalsForSync(): Promise<(Journal & { deleted_at?: number })[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, name, color, is_favorite, created_at, updated_at, deleted_at
         FROM journals
         ORDER BY created_at DESC`,
    );
    return rows ?? [];
  }

  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, name, color, is_favorite, created_at, updated_at, deleted_at
           FROM journals
           ORDER BY created_at DESC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

export async function toggleFavorite(journalId: string, favorite: boolean) {
  const value = favorite ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(`UPDATE journals SET is_favorite = ?, updated_at = ? WHERE id = ?`, [
      value,
      now,
      journalId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE journals SET is_favorite = ?, updated_at = ? WHERE id = ?`, [
        value,
        now,
        journalId,
      ]);
    });
  }
}

//Eliminar journals

export async function deleteJournal(journalId: string) {
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(`UPDATE journals SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      journalId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE journals SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        journalId,
      ]);
    });
  }
}

export async function hardDeleteJournal(journalId: string): Promise<void> {
  if (isAsync) {
    // Primero obtener todas las páginas del journal
    const pages = await (adb as any).getAllAsync?.(
      'SELECT id FROM pages WHERE journal_id = ?',
      [journalId]
    );
    
    // Eliminar cada página con sus elementos
    for (const page of pages || []) {
      await hardDeletePage(page.id);
    }
    
    // Eliminar el journal
    await runAsync('DELETE FROM journals WHERE id = ?', [journalId]);
  } else {
    await txLegacy(async (tx) => {
      // Obtener páginas
      const pages: { id: string }[] = await new Promise((resolve, reject) => {
        tx.executeSql(
          'SELECT id FROM pages WHERE journal_id = ?',
          [journalId],
          (_: any, res: any) => {
            const out: { id: string }[] = [];
            for (let i = 0; i < res.rows.length; i++) {
              out.push(res.rows.item(i));
            }
            resolve(out);
          },
          (_: any, err: any) => {
            reject(err);
            return true;
          }
        );
      });
      
      // Eliminar elementos de cada página
      for (const page of pages) {
        await execTx(tx, 'DELETE FROM page_texts WHERE page_id = ?', [page.id]);
        await execTx(tx, 'DELETE FROM page_draws WHERE page_id = ?', [page.id]);
        await execTx(tx, 'DELETE FROM page_shapes WHERE page_id = ?', [page.id]);
        await execTx(tx, 'DELETE FROM page_images WHERE page_id = ?', [page.id]);
        await execTx(tx, 'DELETE FROM page_stickers WHERE page_id = ?', [page.id]);
        await execTx(tx, 'DELETE FROM page_audios WHERE page_id = ?', [page.id]);
        await execTx(tx, 'DELETE FROM pages WHERE id = ?', [page.id]);
      }
      
      // Eliminar el journal
      await execTx(tx, 'DELETE FROM journals WHERE id = ?', [journalId]);
    });
  }
}

// Obtener el patrón por defecto del diario
export async function getJournalDefaultPattern(journalId: string): Promise<string> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT default_pattern FROM journals WHERE id = ? LIMIT 1`,
      [journalId],
    );
    return rows?.[0]?.default_pattern ?? 'none';
  }

  return new Promise<string>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT default_pattern FROM journals WHERE id = ? LIMIT 1`,
        [journalId],
        (_: any, res: any) => {
          resolve(res.rows.length ? res.rows.item(0).default_pattern ?? 'none' : 'none');
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

// Actualizar el patrón por defecto del diario
export async function updateJournalDefaultPattern(
  journalId: string,
  pattern: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(`UPDATE journals SET default_pattern = ?, updated_at = ? WHERE id = ?`, [
      pattern,
      now,
      journalId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE journals SET default_pattern = ?, updated_at = ? WHERE id = ?`, [
        pattern,
        now,
        journalId,
      ]);
    });
  }
}

// ---------- DAO: Update Journal Cover ----------
export async function updateJournalCover(
  journalId: string,
  updates: {
    name?: string;
    color?: string;
  },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(journalId);

  const sql = `UPDATE journals SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

// ---------- DAO: Pages ----------
export async function getTotalPages(journalId: string): Promise<number> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT COALESCE(MAX(page_number), 0) AS total 
       FROM pages 
       WHERE journal_id = ? AND deleted_at IS NULL`,
      [journalId]
    );
    return rows?.[0]?.total ?? 0;
  }

  return new Promise<number>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT COALESCE(MAX(page_number), 0) AS total 
         FROM pages 
         WHERE journal_id = ? AND deleted_at IS NULL`,
        [journalId],
        (_: any, res: any) => resolve(res.rows.item(0).total ?? 0),
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });
}

export async function getPageId(journalId: string, pageNumber: number): Promise<string | null> {
  if (isAsync) {
    try {
      const query = `SELECT id FROM pages 
                     WHERE journal_id = ? 
                       AND page_number = ? 
                       AND deleted_at IS NULL 
                     LIMIT 1`;
      const rows = await (adb as any).getAllAsync(query, [journalId, pageNumber]);
      return rows?.[0]?.id ?? null;
    } catch (error) {
      console.error('Error in getPageId (async):', error);
      return null;
    }
  }

  return new Promise<string | null>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id FROM pages 
         WHERE journal_id = ? 
           AND page_number = ? 
           AND deleted_at IS NULL 
         LIMIT 1`,
        [journalId, pageNumber],
        (_: any, res: any) => {
          resolve(res.rows.length ? (res.rows.item(0).id as string) : null);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });
}

export async function getPageColor(journalId: string, pageNumber: number): Promise<string | null> {
  if (isAsync) {
    try {
      const query = `SELECT bg_color FROM pages 
                     WHERE journal_id = ? 
                       AND page_number = ? 
                       AND deleted_at IS NULL 
                     LIMIT 1`;
      const rows = await (adb as any).getAllAsync(query, [journalId, pageNumber]);
      return rows?.[0]?.bg_color ?? null;
    } catch (error) {
      console.error('Error in getPageColor (async):', error);
      return null;
    }
  }

  return new Promise<string | null>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT bg_color FROM pages 
         WHERE journal_id = ? 
           AND page_number = ? 
           AND deleted_at IS NULL 
         LIMIT 1`,
        [journalId, pageNumber],
        (_: any, res: any) => {
          resolve(res.rows.length ? (res.rows.item(0).bg_color as string) : null);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });
}

// Actualizar color de una sola página
export async function updatePageColor(
  journalId: string,
  pageNumber: number,
  color: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `UPDATE pages SET bg_color = ?, updated_at = ? WHERE journal_id = ? AND page_number = ?`,
      [color, now, journalId, pageNumber],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `UPDATE pages SET bg_color = ?, updated_at = ? WHERE journal_id = ? AND page_number = ?`,
        [color, now, journalId, pageNumber],
      );
    });
  }
}

// Actualizar color de todas las páginas del journal
export async function updateAllPagesColor(journalId: string, color: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(`UPDATE pages SET bg_color = ?, updated_at = ? WHERE journal_id = ?`, [
      color,
      now,
      journalId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE pages SET bg_color = ?, updated_at = ? WHERE journal_id = ?`, [
        color,
        now,
        journalId,
      ]);
    });
  }
}

export async function createPage(journalId: string, bgColor: string, pattern: string = 'none') {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  console.log('createPage llamado:', { 
    id: id.substring(0, 8), 
    journalId: journalId.substring(0, 8), 
    currentUserId 
  }); 

  if (isAsync) {
    await runAsync('BEGIN');
    try {
      const rows = await (adb as any).getAllAsync?.(
        `SELECT COALESCE(MAX(page_number),0)+1 AS next FROM pages WHERE journal_id = ?`,
        [journalId],
      );
      const next = rows?.[0]?.next ?? 1;

      await runAsync(
        `INSERT INTO pages(id, journal_id, page_number, bg_color, pattern, created_at, updated_at, user_id)
          VALUES(?,?,?,?,?,?,?,?)`,
        [id, journalId, next, bgColor, pattern, now, now, currentUserId],
      );

      await runAsync('COMMIT');
      
      console.log('Página creada:', { 
        pageNumber: next, 
        user_id: currentUserId,
        hasUserId: currentUserId !== null 
      }); 
      
      return { pageNumber: next, total: next };
    } catch (e) {
      await runAsync('ROLLBACK');
      throw e;
    }
  }

  // Legacy
  let next = 1;
  await txLegacy(async (tx) => {
    await new Promise<void>((resolve, reject) => {
      tx.executeSql(
        `SELECT COALESCE(MAX(page_number),0)+1 AS next FROM pages WHERE journal_id = ?`,
        [journalId],
        (_: any, res: any) => {
          next = res.rows.item(0).next ?? 1;
          resolve();
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });

    await execTx(
      tx,
      `INSERT INTO pages(id, journal_id, page_number, bg_color, pattern, created_at, updated_at, user_id)
        VALUES(?,?,?,?,?,?,?,?)`,
      [id, journalId, next, bgColor, pattern, now, now, currentUserId],
    );
  });

  return { pageNumber: next, total: next };
}

// Obtener el patrón de una página:
export async function getPagePattern(
  journalId: string,
  pageNumber: number,
): Promise<string | null> {
  if (isAsync) {
    try {
      const query = `SELECT pattern FROM pages 
                      WHERE journal_id = ? 
                        AND page_number = ? 
                        AND deleted_at IS NULL 
                      LIMIT 1`;
      const rows = await (adb as any).getAllAsync(query, [journalId, pageNumber]);
      return rows?.[0]?.pattern ?? null;
    } catch (error) {
      console.error('Error in getPagePattern (async):', error);
      return null;
    }
  }

  return new Promise<string | null>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT pattern FROM pages 
          WHERE journal_id = ? 
            AND deleted_at IS NULL 
          LIMIT 1`,
        [journalId, pageNumber],
        (_: any, res: any) => {
          resolve(res.rows.length ? (res.rows.item(0).pattern as string) : null);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });
}

// Actualizar el patrón:
export async function updatePagePattern(
  journalId: string,
  pageNumber: number,
  pattern: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `UPDATE pages SET pattern = ?, updated_at = ? WHERE journal_id = ? AND page_number = ?`,
      [pattern, now, journalId, pageNumber],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `UPDATE pages SET pattern = ?, updated_at = ? WHERE journal_id = ? AND page_number = ?`,
        [pattern, now, journalId, pageNumber],
      );
    });
  }
}

// Eliminar paginas

export async function deletePage(journalId: string, pageNumber: number) {
  if (pageNumber < 1) return { pageNumber: 1, total: 1 };

  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync('BEGIN');
    try {
      await runAsync(
        `UPDATE pages SET deleted_at = ?, updated_at = ? WHERE journal_id = ? AND page_number = ?`,
        [now, now, journalId, pageNumber]
      );

      // Actualizar números de páginas posteriores
      await runAsync(
        `UPDATE pages
            SET page_number = page_number - 1,
                updated_at   = ?
          WHERE journal_id = ? 
            AND page_number > ?
            AND deleted_at IS NULL`,
        [now, journalId, pageNumber]
      );

      await runAsync('COMMIT');

      // Calcular total de páginas NO eliminadas
      const rows = await (adb as any).getAllAsync?.(
        `SELECT COALESCE(MAX(page_number), 0) AS total 
          FROM pages 
          WHERE journal_id = ? AND deleted_at IS NULL`,
        [journalId]
      );
      const total = Math.max(rows?.[0]?.total ?? 0, 0);
      const target = Math.max(Math.min(pageNumber, total), 1);

      return { pageNumber: Math.max(target, 1), total: Math.max(total, 1) };
    } catch (e) {
      await runAsync('ROLLBACK');
      throw e;
    }
  }

  // Legacy
  await txLegacy(async (tx) => {
    await execTx(
      tx,
      `UPDATE pages SET deleted_at = ?, updated_at = ? WHERE journal_id = ? AND page_number = ?`,
      [now, now, journalId, pageNumber]
    );
    
    await execTx(
      tx,
      `UPDATE pages
         SET page_number = page_number - 1,
             updated_at   = ?
       WHERE journal_id = ? 
         AND page_number > ?
         AND deleted_at IS NULL`,
      [now, journalId, pageNumber]
    );
  });

  const total = await new Promise<number>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT COALESCE(MAX(page_number), 0) AS total 
         FROM pages 
         WHERE journal_id = ? AND deleted_at IS NULL`,
        [journalId],
        (_: any, res: any) => resolve(res.rows.item(0).total ?? 0),
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });

  const target = Math.max(Math.min(pageNumber, total), 1);
  return { pageNumber: Math.max(target, 1), total: Math.max(total, 1) };
}

// ---------- DAO: Page Texts ----------
export type PageText = {
  id: string;
  page_id: string;
  content: string;
  font_family: string;
  color: string;
  position_x: number;
  position_y: number;
  font_size: number;
  text_width?: number;
  created_at: number;
  updated_at: number;
  is_locked?: number;
  rotation?: number;
};

export async function createPageText(
  pageId: string,
  content: string,
  fontFamily: string,
  color: string,
  positionX: number,
  positionY: number,
  fontSize: number = 16,
  rotation?: number,
  isLocked?: number,
  textWidth?: number,
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_texts(id, page_id, content, font_family, color, position_x, position_y, font_size, rotation, is_locked, text_width, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        pageId,
        content,
        fontFamily,
        color,
        positionX,
        positionY,
        fontSize,
        rotation ?? 0,
        isLocked ?? 0,
        textWidth ?? 200,
        now,
        now,
        currentUserId,
      ],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_texts(id, page_id, content, font_family, color, position_x, position_y, font_size, rotation, is_locked, text_width, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          pageId,
          content,
          fontFamily,
          color,
          positionX,
          positionY,
          fontSize,
          rotation ?? 0,
          isLocked ?? 0,
          textWidth ?? 200,
          now,
          now,
          currentUserId,
        ],
      );
    });
  }
  return { id };
}

// Actualizar listPageTexts
export async function listPageTexts(pageId: string): Promise<PageText[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, content, font_family, color, position_x, position_y, font_size, text_width, created_at, updated_at, is_locked, rotation
         FROM page_texts
        WHERE page_id = ? AND deleted_at IS NULL
        ORDER BY created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageText[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, content, font_family, color, position_x, position_y, font_size, text_width, created_at, updated_at, is_locked, rotation
           FROM page_texts
          WHERE page_id = ? AND deleted_at IS NULL
          ORDER BY created_at ASC`,
        [pageId],
        (_: any, res: any) => {
          const out: PageText[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}


export async function updatePageText(
  textId: string,
  updates: {
    content?: string;
    font_family?: string;
    color?: string;
    position_x?: number;
    position_y?: number;
    font_size?: number;
    is_locked?: number;
    rotation?: number;
    text_width?: number;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
  }
  if (updates.font_family !== undefined) {
    fields.push('font_family = ?');
    values.push(updates.font_family);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.position_x !== undefined) {
    fields.push('position_x = ?');
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push('position_y = ?');
    values.push(updates.position_y);
  }
  if (updates.font_size !== undefined) {
    fields.push('font_size = ?');
    values.push(updates.font_size);
  }
  if (updates.is_locked !== undefined) {
    fields.push('is_locked = ?');
    values.push(updates.is_locked);
  }
  if (updates.rotation !== undefined) {
    fields.push('rotation = ?');
    values.push(updates.rotation);
  }
  if (updates.text_width !== undefined) {
    fields.push('text_width = ?');
    values.push(updates.text_width);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(textId);

  const sql = `UPDATE page_texts SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function deletePageText(textId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE page_texts SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      textId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_texts SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        textId,
      ]);
    });
  }
}

// ---------- DAO: Page forms (shapes) --------
export type ShapeType =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'rectangle'
  | 'line'
  | 'arrow'
  | 'diamond'
  | 'pentagon'
  | 'sun'
  | 'bolt'
  | 'flower'
  | 'mountain';

export type PageShape = {
  id: string;
  page_id: string;
  shape_type: ShapeType;
  color: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  is_locked: number;
  created_at: number;
  updated_at: number;
};

export async function createPageShape(
  pageId: string,
  shapeType: ShapeType,
  color: string,
  positionX: number,
  positionY: number,
  width: number = 100,
  height: number = 100,
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_shapes(id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        pageId,
        shapeType,
        color,
        positionX,
        positionY,
        width,
        height,
        0,
        0,
        now,
        now,
        currentUserId,
      ],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_shapes(id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          pageId,
          shapeType,
          color,
          positionX,
          positionY,
          width,
          height,
          0,
          0,
          now,
          now,
          currentUserId,
        ],
      );
    });
  }
  return { id };
}

export async function listPageShapes(pageId: string): Promise<PageShape[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at
          FROM page_shapes
        WHERE page_id = ? AND deleted_at IS NULL
        ORDER BY created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageShape[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at
            FROM page_shapes
          WHERE page_id = ? AND deleted_at IS NULL
          ORDER BY created_at ASC`,
        [pageId],
        (_: any, res: any) => {
          const out: PageShape[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

export async function updatePageShape(
  shapeId: string,
  updates: {
    color?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    is_locked?: number;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }
  if (updates.position_x !== undefined) {
    fields.push('position_x = ?');
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push('position_y = ?');
    values.push(updates.position_y);
  }
  if (updates.width !== undefined) {
    fields.push('width = ?');
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push('height = ?');
    values.push(updates.height);
  }
  if (updates.rotation !== undefined) {
    fields.push('rotation = ?');
    values.push(updates.rotation);
  }
  if (updates.is_locked !== undefined) {
    fields.push('is_locked = ?');
    values.push(updates.is_locked);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(shapeId);

  const sql = `UPDATE page_shapes SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function deletePageShape(shapeId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE page_shapes SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      shapeId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_shapes SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        shapeId,
      ]);
    });
  }
}

// ========== DAO: Page Draws (Dibujos) ==========
export type PageDraw = {
  id: string;
  page_id: string;
  path_d: string;
  color: string;
  width: number;
  opacity: number;
  tool: 'pencil' | 'pen' | 'marker';
  order_index: number;
  created_at: number;
  updated_at: number;
};

export async function createPageDraw(
  pageId: string,
  pathD: string,
  color: string,
  width: number,
  opacity: number,
  tool: 'pencil' | 'pen' | 'marker',
  orderIndex?: number,
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    if (orderIndex == null) {
      const rows = await (adb as any).getAllAsync?.(
        `SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM page_draws WHERE page_id = ?`,
        [pageId],
      );
      orderIndex = rows?.[0]?.next ?? 1;
    }

    await runAsync(
      `INSERT INTO page_draws(id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [id, pageId, pathD, color, width, opacity, tool, orderIndex, now, now, currentUserId],
    );
  } else {
    await txLegacy(async (tx) => {
      if (orderIndex == null) {
        orderIndex = await new Promise<number>((resolve, reject) => {
          tx.executeSql(
            `SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM page_draws WHERE page_id = ?`,
            [pageId],
            (_: any, res: any) => resolve(res.rows.item(0).next ?? 1),
            (_: any, err: any) => {
              reject(err);
              return true;
            },
          );
        });
      }

      await execTx(
        tx,
        `INSERT INTO page_draws(id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        [id, pageId, pathD, color, width, opacity, tool, orderIndex, now, now, currentUserId],
      );
    });
  }

  return { id, order_index: orderIndex! };
}

export async function listPageDraws(pageId: string): Promise<PageDraw[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at
        FROM page_draws
        WHERE page_id = ? AND deleted_at IS NULL
        ORDER BY order_index ASC, created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageDraw[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at
          FROM page_draws
          WHERE page_id = ? AND deleted_at IS NULL
          ORDER BY order_index ASC, created_at ASC`,
        [pageId],
        (_: any, res: any) => {
          const out: PageDraw[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

export async function deletePageDraw(drawId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE page_draws SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      drawId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_draws SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        drawId,
      ]);
    });
  }
}
// ---------- DAO: Page Stickers ----------
export type PageSticker = {
  id: string;
  page_id: string;
  sticker_url: string;
  sticker_category: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  is_locked: number;
  created_at: number;
  updated_at: number;
};

export async function createPageSticker(
  pageId: string,
  stickerUrl: string,
  stickerCategory: string,
  positionX: number,
  positionY: number,
  width: number = 100,
  height: number = 100,
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        pageId,
        stickerUrl,
        stickerCategory,
        positionX,
        positionY,
        width,
        height,
        0,
        0,
        now,
        now,
        currentUserId,
      ],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at,user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          pageId,
          stickerUrl,
          stickerCategory,
          positionX,
          positionY,
          width,
          height,
          0,
          0,
          now,
          now,
          currentUserId,
        ],
      );
    });
  }
  return { id };
}

export async function listPageStickers(pageId: string): Promise<PageSticker[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at
       FROM page_stickers
       WHERE page_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageSticker[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at
         FROM page_stickers
         WHERE page_id = ? AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [pageId],
        (_: any, res: any) => {
          const out: PageSticker[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

export async function updatePageSticker(
  stickerId: string,
  updates: {
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    is_locked?: number;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.position_x !== undefined) {
    fields.push('position_x = ?');
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push('position_y = ?');
    values.push(updates.position_y);
  }
  if (updates.width !== undefined) {
    fields.push('width = ?');
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push('height = ?');
    values.push(updates.height);
  }
  if (updates.rotation !== undefined) {
    fields.push('rotation = ?');
    values.push(updates.rotation);
  }
  if (updates.is_locked !== undefined) {
    fields.push('is_locked = ?');
    values.push(updates.is_locked);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(stickerId);

  const sql = `UPDATE page_stickers SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function duplicatePageSticker(stickerId: string): Promise<{ id: string } | null> {
  let originalSticker: PageSticker | null = null;

  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT * FROM page_stickers WHERE id = ? LIMIT 1`,
      [stickerId],
    );
    originalSticker = rows?.[0] ?? null;
  } else {
    originalSticker = await new Promise<PageSticker | null>((resolve, reject) => {
      legacyDb.readTransaction((tx: any) => {
        tx.executeSql(
          `SELECT * FROM page_stickers WHERE id = ? LIMIT 1`,
          [stickerId],
          (_: any, res: any) => {
            resolve(res.rows.length ? res.rows.item(0) : null);
          },
          (_: any, err: any) => {
            reject(err);
            return true;
          },
        );
      });
    });
  }

  if (!originalSticker) return null;

  const newId = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const offsetX = 20;
  const offsetY = 20;

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        originalSticker.page_id,
        originalSticker.sticker_url,
        originalSticker.sticker_category,
        originalSticker.position_x + offsetX,
        originalSticker.position_y + offsetY,
        originalSticker.width,
        originalSticker.height,
        originalSticker.rotation,
        0,
        now,
        now,
      ],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          newId,
          originalSticker.page_id,
          originalSticker.sticker_url,
          originalSticker.sticker_category,
          originalSticker.position_x + offsetX,
          originalSticker.position_y + offsetY,
          originalSticker.width,
          originalSticker.height,
          originalSticker.rotation,
          0,
          now,
          now,
        ],
      );
    });
  }

  return { id: newId };
}

export async function deletePageSticker(stickerId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE page_stickers SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      stickerId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_stickers SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        stickerId,
      ]);
    });
  }
}

export async function toggleStickerLock(stickerId: string, locked: boolean) {
  const value = locked ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(`UPDATE page_stickers SET is_locked = ?, updated_at = ? WHERE id = ?`, [
      value,
      now,
      stickerId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_stickers SET is_locked = ?, updated_at = ? WHERE id = ?`, [
        value,
        now,
        stickerId,
      ]);
    });
  }
}

export async function deleteAllPageStickers(pageId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM page_stickers WHERE page_id = ?`, [pageId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM page_stickers WHERE page_id = ?`, [pageId]);
    });
  }
}

export async function getPageSticker(stickerId: string): Promise<PageSticker | null> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT * FROM page_stickers WHERE id = ? LIMIT 1`,
      [stickerId],
    );
    return rows?.[0] ?? null;
  }

  return new Promise<PageSticker | null>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT * FROM page_stickers WHERE id = ? LIMIT 1`,
        [stickerId],
        (_: any, res: any) => {
          resolve(res.rows.length ? res.rows.item(0) : null);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

// ---------- DAO: Page Images ----------
export type PageImage = {
  id: string;
  page_id: string;
  uri: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  created_at: number;
  updated_at: number;
};

export async function createPageImage(
  pageId: string,
  localUri: string,
  positionX: number,
  positionY: number,
  width: number = 100,
  height: number = 100,
  token?: string, 
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Subir a Supabase Storage 
  let supabaseUri: string;
  try {
    const { uploadImageToSupabase } = await import('@/src/service/storageService');
    
    if (!token) {
      throw new Error('Token de autenticación requerido');
    }
    
    const userId = getCurrentUserId() || 'anonymous';
    const extension = localUri.split('.').pop() || 'jpg';
    const remotePath = `${userId}/${id}.${extension}`;
    
    supabaseUri = await uploadImageToSupabase(localUri, remotePath, token); 
    console.log('Imagen subida a Supabase:', supabaseUri);
  } catch (error) {
    console.error('Error subiendo imagen a Supabase:', error);
    throw new Error('No se pudo subir la imagen. Verifica tu conexión a internet.');
  }

  // Solo guardar en BD si la subida fue exitosa
  if (isAsync) {
    await runAsync(
      `INSERT INTO page_images(id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [id, pageId, supabaseUri, positionX, positionY, width, height, 0, now, now, currentUserId],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_images(id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        [id, pageId, supabaseUri, positionX, positionY, width, height, 0, now, now, currentUserId],
      );
    });
  }

  return { id };
}

export async function listPageImages(pageId: string): Promise<PageImage[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at
         FROM page_images
        WHERE page_id = ? AND deleted_at IS NULL
        ORDER BY created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageImage[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at
           FROM page_images
          WHERE page_id = ? AND deleted_at IS NULL
          ORDER BY created_at ASC`,
        [pageId],
        (_: any, res: any) => {
          const out: PageImage[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}


export async function updatePageImage(
  imageId: string,
  updates: {
    uri?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    rotation?: number;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.uri !== undefined) {
    fields.push('uri = ?');
    values.push(updates.uri);
  }
  if (updates.position_x !== undefined) {
    fields.push('position_x = ?');
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push('position_y = ?');
    values.push(updates.position_y);
  }
  if (updates.width !== undefined) {
    fields.push('width = ?');
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push('height = ?');
    values.push(updates.height);
  }
  if (updates.rotation !== undefined) {
    fields.push('rotation = ?');
    values.push(updates.rotation);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(imageId);

  const sql = `UPDATE page_images SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function deletePageImage(imageId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE page_images SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      imageId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_images SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        imageId,
      ]);
    });
  }
}

// ---------- DAO: Page Audios ----------
export type PageAudio = {
  id: string;
  page_id: string;
  audio_uri: string;
  audio_type: 'recording' | 'file';
  position_x: number;
  position_y: number;
  is_locked: number;
  created_at: number;
  updated_at: number;
};

export async function createPageAudio(
  pageId: string,
  audioUri: string,
  audioType: 'recording' | 'file',
  positionX: number,
  positionY: number,
  token?: string, 
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Subir a Supabase Storage PRIMERO
  let supabaseUri: string;
  try {
    const { uploadAudioToSupabase } = await import('@/src/service/storageService');
    
    if (!token) {
      throw new Error('Token de autenticación requerido');
    }
    
    const userId = getCurrentUserId() || 'anonymous';
    const extension = audioUri.split('.').pop() || 'm4a';
    const remotePath = `${userId}/${id}.${extension}`;
    
    supabaseUri = await uploadAudioToSupabase(audioUri, remotePath, token); 
    console.log('Audio subido a Supabase:', supabaseUri);
  } catch (error) {
    console.error('Error subiendo audio a Supabase:', error);
    throw new Error('No se pudo subir el audio. Verifica tu conexión a internet.');
  }

  // Solo guardar en BD si la subida fue exitosa
  if (isAsync) {
    await runAsync(
      `INSERT INTO page_audios(id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id, pageId, supabaseUri, audioType, positionX, positionY, 0, now, now, currentUserId],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_audios(id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [id, pageId, supabaseUri, audioType, positionX, positionY, 0, now, now, currentUserId],
      );
    });
  }
  return { id };
}

export async function listPageAudios(pageId: string): Promise<PageAudio[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, created_at, updated_at
       FROM page_audios
       WHERE page_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageAudio[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, created_at, updated_at
         FROM page_audios
         WHERE page_id = ? AND deleted_at IS NULL
         ORDER BY created_at ASC`,
        [pageId],
        (_: any, res: any) => {
          const out: PageAudio[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

export async function updatePageAudio(
  audioId: string,
  updates: {
    position_x?: number;
    position_y?: number;
    is_locked?: number;
    audio_uri?: string;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.position_x !== undefined) {
    fields.push('position_x = ?');
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push('position_y = ?');
    values.push(updates.position_y);
  }
  if (updates.is_locked !== undefined) {
    fields.push('is_locked = ?');
    values.push(updates.is_locked);
  }

  if (updates.audio_uri !== undefined) {
    fields.push('audio_uri = ?');
    values.push(updates.audio_uri);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(audioId);

  const sql = `UPDATE page_audios SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function togglePageAudioLock(audioId: string) {
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `UPDATE page_audios SET is_locked = NOT is_locked, updated_at = ? WHERE id = ?`,
      [now, audioId],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `UPDATE page_audios SET is_locked = NOT is_locked, updated_at = ? WHERE id = ?`,
        [now, audioId],
      );
    });
  }
}

export async function deletePageAudio(audioId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE page_audios SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      audioId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE page_audios SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        audioId,
      ]);
    });
  }
}

// ---------- DAO: Tasks ----------
export type Task = {
  id: string;
  title: string;
  is_completed: number;
  created_at: number;
  updated_at: number;
};

export async function createTask(title: string) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO tasks(id, title, is_completed, created_at, updated_at, user_id)
        VALUES(?,?,?,?,?,?)`,
      [id, title, 0, now, now, currentUserId],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO tasks(id, title, is_completed, created_at, updated_at, user_id)
          VALUES(?,?,?,?,?,?)`,
        [id, title, 0, now, now, currentUserId],
      );
    });
  }
  return { id };
}

export async function listTasks(): Promise<Task[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, title, is_completed, created_at, updated_at
          FROM tasks
        WHERE deleted_at IS NULL
        ORDER BY is_completed ASC, created_at ASC`,
    );
    return rows ?? [];
  }

  return new Promise<Task[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, title, is_completed, created_at, updated_at
            FROM tasks
          WHERE deleted_at IS NULL
          ORDER BY is_completed ASC, created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: Task[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        },
      );
    });
  });
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    is_completed?: boolean;
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.is_completed !== undefined) {
    fields.push('is_completed = ?');
    values.push(updates.is_completed ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(taskId);

  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function toggleTaskCompletion(taskId: string, completed: boolean) {
  const value = completed ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(`UPDATE tasks SET is_completed = ?, updated_at = ? WHERE id = ?`, [
      value,
      now,
      taskId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE tasks SET is_completed = ?, updated_at = ? WHERE id = ?`, [
        value,
        now,
        taskId,
      ]);
    });
  }
}

export async function deleteTask(taskId: string) {
  const now = Math.floor(Date.now() / 1000);
  
  if (isAsync) {
    await runAsync(`UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      taskId,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?`, [
        now,
        now,
        taskId,
      ]);
    });
  }
}

export async function insertTaskFromRemote(task: any): Promise<void> {
  const created_at = typeof task.created_at === 'string' 
    ? Math.floor(new Date(task.created_at).getTime() / 1000)
    : task.created_at;
  
  const updated_at = typeof task.updated_at === 'string'
    ? Math.floor(new Date(task.updated_at).getTime() / 1000)
    : task.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO tasks(id, title, is_completed, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?)`,
      [task.id, task.title, task.is_completed ?? 0, created_at, updated_at, task.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO tasks(id, title, is_completed, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?)`,
        [task.id, task.title, task.is_completed ?? 0, created_at, updated_at, task.user_id]
      );
    });
  }
}

// ---------- DAO: Page Snapshot / Preview ----------
export type PageSnapshot = {
  page_id: string;
  journal_id: string;
  page_number: number;
  bg_color: string | null;
  texts: PageText[];
  shapes: PageShape[];
  draws: PageDraw[];
  images: PageImage[];
  stickers: PageSticker[];
  audios: PageAudio[];
};

export async function getPageSnapshot(
  journalId: string,
  pageNumber: number,
): Promise<PageSnapshot | null> {
  const pageId = await getPageId(journalId, pageNumber);
  if (!pageId) {
    return null;
  }

  const bg_color = await getPageColor(journalId, pageNumber);

  const [texts, shapes, draws, images, stickers, audios] = await Promise.all([
    listPageTexts(pageId),
    listPageShapes(pageId),
    listPageDraws(pageId),
    listPageImages(pageId),
    listPageStickers(pageId),
    listPageAudios(pageId),
  ]);

  return {
    page_id: pageId,
    journal_id: journalId,
    page_number: pageNumber,
    bg_color,
    texts,
    shapes,
    draws,
    images,
    stickers,
    audios,
  };
}
// ---------- USER ID MANAGEMENT ----------
let currentUserId: string | null = null;

export function setCurrentUserId(userId: string) {
  currentUserId = userId;
  console.log('Current user ID set:', userId);
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export async function updateUserIdForExistingData() {
  if (!currentUserId) {
    console.log('No user ID set, skipping update');
    return;
  }

  const now = Math.floor(Date.now() / 1000);

  console.log('Updating user_id for existing data...');

  if (isAsync) {
    await runAsyncIgnore(`UPDATE journals SET user_id = ?, updated_at = ? WHERE user_id IS NULL`, [
      currentUserId,
      now,
    ]);
    await runAsyncIgnore(`UPDATE pages SET user_id = ?, updated_at = ? WHERE user_id IS NULL`, [
      currentUserId,
      now,
    ]);
    await runAsyncIgnore(
      `UPDATE page_texts SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
      [currentUserId, now],
    );
    await runAsyncIgnore(
      `UPDATE page_draws SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
      [currentUserId, now],
    );
    await runAsyncIgnore(
      `UPDATE page_shapes SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
      [currentUserId, now],
    );
    await runAsyncIgnore(
      `UPDATE page_stickers SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
      [currentUserId, now],
    );
    await runAsyncIgnore(
      `UPDATE page_images SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
      [currentUserId, now],
    );
    await runAsyncIgnore(
      `UPDATE page_audios SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
      [currentUserId, now],
    );
    await runAsyncIgnore(`UPDATE tasks SET user_id = ?, updated_at = ? WHERE user_id IS NULL`, [
      currentUserId,
      now,
    ]);
  } else {
    await txLegacy(async (tx) => {
      await execTxIgnore(
        tx,
        `UPDATE journals SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(tx, `UPDATE pages SET user_id = ?, updated_at = ? WHERE user_id IS NULL`, [
        currentUserId,
        now,
      ]);
      await execTxIgnore(
        tx,
        `UPDATE page_texts SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(
        tx,
        `UPDATE page_draws SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(
        tx,
        `UPDATE page_shapes SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(
        tx,
        `UPDATE page_stickers SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(
        tx,
        `UPDATE page_images SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(
        tx,
        `UPDATE page_audios SET user_id = ?, updated_at = ? WHERE user_id IS NULL`,
        [currentUserId, now],
      );
      await execTxIgnore(tx, `UPDATE tasks SET user_id = ?, updated_at = ? WHERE user_id IS NULL`, [
        currentUserId,
        now,
      ]);
    });
  }

  console.log('user_id updated for existing data');
}
// ----------- FUNCION AUXILIAR PARA SYNC ----------
export async function insertJournalFromRemote(journal: {
  id: string;
  name: string;
  color: string;
  is_favorite: number;
  created_at: number | string;
  updated_at: number | string;
  user_id: string;
}): Promise<void> {

  // Convertir timestamps si vienen como string ISO
  const created_at = typeof journal.created_at === 'string' 
    ? Math.floor(new Date(journal.created_at).getTime() / 1000)
    : journal.created_at;
  
  const updated_at = typeof journal.updated_at === 'string'
    ? Math.floor(new Date(journal.updated_at).getTime() / 1000)
    : journal.updated_at;

  console.log(' Guardando journal localmente:', journal.id.substring(0, 8)); 

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO journals(id, name, color, is_favorite, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?)`,
      [
        journal.id,
        journal.name,
        journal.color,
        journal.is_favorite,
        created_at,
        updated_at,
        journal.user_id,
      ],
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT OR REPLACE INTO journals(id, name, color, is_favorite, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?)`,
        [
          journal.id,
          journal.name,
          journal.color,
          journal.is_favorite,
          created_at,
          updated_at,
          journal.user_id,
        ],
      );
    });
  }
}


// ---------- SYNC: Pages ----------

export async function listAllPagesForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, journal_id, page_number, bg_color as color, pattern, created_at, updated_at, user_id, deleted_at
        FROM pages
        ORDER BY created_at ASC`
    );
    return rows ?? [];
  }

  return new Promise<any[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, journal_id, page_number, bg_color as color, pattern, created_at, updated_at, user_id, deleted_at
          FROM pages
          ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) {
            out.push(res.rows.item(i));
          }
          resolve(out);
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });
}

// Insertar o actualizar página desde remoto
export async function insertPageFromRemote(page: {
  id: string;
  journal_id: string;
  page_number: number;
  color: string;
  pattern: string;
  created_at: string | number;
  updated_at: string | number;
  user_id: string;
  deleted_at?: number | null;
}): Promise<void> {
  const created_at = typeof page.created_at === 'string' 
    ? Math.floor(new Date(page.created_at).getTime() / 1000)
    : page.created_at;
  
  const updated_at = typeof page.updated_at === 'string'
    ? Math.floor(new Date(page.updated_at).getTime() / 1000)
    : page.updated_at;

  //  VALIDACIÓN SIMPLE - SI NO EXISTE EL JOURNAL, SALIR
  if (isAsync) {
    const journal = await (adb as any).getFirstAsync(
      'SELECT id FROM journals WHERE id = ?',
      [page.journal_id]
    );
    
    if (!journal) {
      console.log(`Página ${page.page_number} ignorada - journal ${page.journal_id.substring(0, 8)} no existe`);
      return; 
    }
  } else {
    const journal = await new Promise<any>((resolve, reject) => {
      legacyDb.readTransaction((tx: any) => {
        tx.executeSql(
          'SELECT id FROM journals WHERE id = ?',
          [page.journal_id],
          (_: any, res: any) => resolve(res.rows.length ? res.rows.item(0) : null),
          (_: any, err: any) => { reject(err); return true; }
        );
      });
    });
    
    if (!journal) {
      console.log(`  Página ${page.page_number} ignorada - journal ${page.journal_id.substring(0, 8)} no existe`);
      return;
    }
  }

  console.log(' Guardando página localmente:', page.id.substring(0, 8), 'del journal', page.journal_id.substring(0, 8));

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO pages(id, journal_id, page_number, bg_color, pattern, created_at, updated_at, user_id, deleted_at)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [
        page.id,
        page.journal_id,
        page.page_number,
        page.color,
        page.pattern,
        created_at,
        updated_at,
        page.user_id,
        page.deleted_at || null,
      ]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT OR REPLACE INTO pages(id, journal_id, page_number, bg_color, pattern, created_at, updated_at, user_id, deleted_at)
         VALUES(?,?,?,?,?,?,?,?,?)`,
        [
          page.id,
          page.journal_id,
          page.page_number,
          page.color,
          page.pattern,
          created_at,
          updated_at,
          page.user_id,
          page.deleted_at || null,
        ]
      );
    });
  }
  
  console.log('Página guardada exitosamente');
}

// Eliminar página permanentemente (para sync)
export async function hardDeletePage(pageId: string): Promise<void> {
  if (isAsync) {
    // Primero eliminar todos los elementos relacionados
    await runAsync('DELETE FROM page_texts WHERE page_id = ?', [pageId]);
    await runAsync('DELETE FROM page_draws WHERE page_id = ?', [pageId]);
    await runAsync('DELETE FROM page_shapes WHERE page_id = ?', [pageId]);
    await runAsync('DELETE FROM page_images WHERE page_id = ?', [pageId]);
    await runAsync('DELETE FROM page_stickers WHERE page_id = ?', [pageId]);
    await runAsync('DELETE FROM page_audios WHERE page_id = ?', [pageId]);
    
    // Luego eliminar la página
    await runAsync('DELETE FROM pages WHERE id = ?', [pageId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_texts WHERE page_id = ?', [pageId]);
      await execTx(tx, 'DELETE FROM page_draws WHERE page_id = ?', [pageId]);
      await execTx(tx, 'DELETE FROM page_shapes WHERE page_id = ?', [pageId]);
      await execTx(tx, 'DELETE FROM page_images WHERE page_id = ?', [pageId]);
      await execTx(tx, 'DELETE FROM page_stickers WHERE page_id = ?', [pageId]);
      await execTx(tx, 'DELETE FROM page_audios WHERE page_id = ?', [pageId]);
      await execTx(tx, 'DELETE FROM pages WHERE id = ?', [pageId]);
    });
  }
}

// ---------- SYNC: Listar todos los elementos para sincronización ----------

// ---------- SYNC: Page Texts ----------
export async function listAllPageTextsForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, page_id, content, font_family, color, position_x, position_y, 
              font_size, rotation, is_locked, text_width, created_at, updated_at, 
              user_id, deleted_at
       FROM page_texts 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, content, font_family, color, position_x, position_y, 
                font_size, rotation, is_locked, text_width, created_at, updated_at, 
                user_id, deleted_at
         FROM page_texts 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// ---------- SYNC: Page Draws ----------
export async function listAllPageDrawsForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, page_id, path_d, color, width, opacity, tool, order_index, 
              created_at, updated_at, user_id, deleted_at
       FROM page_draws 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, path_d, color, width, opacity, tool, order_index, 
                created_at, updated_at, user_id, deleted_at
         FROM page_draws 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// ---------- SYNC: Page Shapes ----------
export async function listAllPageShapesForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, page_id, shape_type, color, position_x, position_y, width, height, 
              rotation, is_locked, created_at, updated_at, user_id, deleted_at
       FROM page_shapes 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, shape_type, color, position_x, position_y, width, height, 
                rotation, is_locked, created_at, updated_at, user_id, deleted_at
         FROM page_shapes 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// ---------- SYNC: Page Stickers ----------
export async function listAllPageStickersForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, page_id, sticker_url, sticker_category, position_x, position_y, 
              width, height, rotation, is_locked, created_at, updated_at, user_id, deleted_at
       FROM page_stickers 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, sticker_url, sticker_category, position_x, position_y, 
                width, height, rotation, is_locked, created_at, updated_at, user_id, deleted_at
         FROM page_stickers 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// ---------- SYNC: Page Images ----------
export async function listAllPageImagesForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, page_id, uri, position_x, position_y, width, height, rotation, 
              created_at, updated_at, user_id, deleted_at
       FROM page_images 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, uri, position_x, position_y, width, height, rotation, 
                created_at, updated_at, user_id, deleted_at
         FROM page_images 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// ---------- SYNC: Page Audios ----------
export async function listAllPageAudiosForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, 
              created_at, updated_at, user_id, deleted_at
       FROM page_audios 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, 
                created_at, updated_at, user_id, deleted_at
         FROM page_audios 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// ---------- SYNC: Tasks ----------
export async function listAllTasksForSync(): Promise<any[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync(
      `SELECT id, title, is_completed, created_at, updated_at, user_id, deleted_at
       FROM tasks 
       ORDER BY created_at ASC`
    );
    return rows ?? [];
  }
  
  return new Promise((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, title, is_completed, created_at, updated_at, user_id, deleted_at
         FROM tasks 
         ORDER BY created_at ASC`,
        [],
        (_: any, res: any) => {
          const out: any[] = [];
          for (let i = 0; i < res.rows.length; i++) out.push(res.rows.item(i));
          resolve(out);
        },
        (_: any, err: any) => { reject(err); return true; }
      );
    });
  });
}

// Funciones para insertar desde remoto
export async function insertPageTextFromRemote(text: any): Promise<void> {
  const created_at = typeof text.created_at === 'string' 
    ? Math.floor(new Date(text.created_at).getTime() / 1000)
    : text.created_at;
  
  const updated_at = typeof text.updated_at === 'string'
    ? Math.floor(new Date(text.updated_at).getTime() / 1000)
    : text.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO page_texts(id, page_id, content, font_family, color, position_x, position_y, font_size, rotation, is_locked, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [text.id, text.page_id, text.content, text.font_family, text.color, text.position_x, text.position_y, text.font_size, text.rotation ?? 0, text.is_locked ?? 0, created_at, updated_at, text.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO page_texts(id, page_id, content, font_family, color, position_x, position_y, font_size, rotation, is_locked, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [text.id, text.page_id, text.content, text.font_family, text.color, text.position_x, text.position_y, text.font_size, text.rotation ?? 0, text.is_locked ?? 0, created_at, updated_at, text.user_id]
      );
    });
  }
}

export async function insertPageDrawFromRemote(draw: any): Promise<void> {
  const created_at = typeof draw.created_at === 'string' 
    ? Math.floor(new Date(draw.created_at).getTime() / 1000)
    : draw.created_at;
  
  const updated_at = typeof draw.updated_at === 'string'
    ? Math.floor(new Date(draw.updated_at).getTime() / 1000)
    : draw.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO page_draws(id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [draw.id, draw.page_id, draw.path_d, draw.color, draw.width, draw.opacity, draw.tool, draw.order_index, created_at, updated_at, draw.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO page_draws(id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        [draw.id, draw.page_id, draw.path_d, draw.color, draw.width, draw.opacity, draw.tool, draw.order_index, created_at, updated_at, draw.user_id]
      );
    });
  }
}

export async function insertPageShapeFromRemote(shape: any): Promise<void> {
  const created_at = typeof shape.created_at === 'string' 
    ? Math.floor(new Date(shape.created_at).getTime() / 1000)
    : shape.created_at;
  
  const updated_at = typeof shape.updated_at === 'string'
    ? Math.floor(new Date(shape.updated_at).getTime() / 1000)
    : shape.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO page_shapes(id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [shape.id, shape.page_id, shape.shape_type, shape.color, shape.position_x, shape.position_y, shape.width, shape.height, shape.rotation ?? 0, shape.is_locked ?? 0, created_at, updated_at, shape.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO page_shapes(id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [shape.id, shape.page_id, shape.shape_type, shape.color, shape.position_x, shape.position_y, shape.width, shape.height, shape.rotation ?? 0, shape.is_locked ?? 0, created_at, updated_at, shape.user_id]
      );
    });
  }
}

export async function insertPageImageFromRemote(image: any): Promise<void> {
  const created_at = typeof image.created_at === 'string' 
    ? Math.floor(new Date(image.created_at).getTime() / 1000)
    : image.created_at;
  
  const updated_at = typeof image.updated_at === 'string'
    ? Math.floor(new Date(image.updated_at).getTime() / 1000)
    : image.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO page_images(id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [image.id, image.page_id, image.uri, image.position_x, image.position_y, image.width, image.height, image.rotation ?? 0, created_at, updated_at, image.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO page_images(id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        [image.id, image.page_id, image.uri, image.position_x, image.position_y, image.width, image.height, image.rotation ?? 0, created_at, updated_at, image.user_id]
      );
    });
  }
}

export async function insertPageStickerFromRemote(sticker: any): Promise<void> {
  const created_at = typeof sticker.created_at === 'string' 
    ? Math.floor(new Date(sticker.created_at).getTime() / 1000)
    : sticker.created_at;
  
  const updated_at = typeof sticker.updated_at === 'string'
    ? Math.floor(new Date(sticker.updated_at).getTime() / 1000)
    : sticker.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [sticker.id, sticker.page_id, sticker.sticker_url, sticker.sticker_category, sticker.position_x, sticker.position_y, sticker.width, sticker.height, sticker.rotation ?? 0, sticker.is_locked ?? 0, created_at, updated_at, sticker.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [sticker.id, sticker.page_id, sticker.sticker_url, sticker.sticker_category, sticker.position_x, sticker.position_y, sticker.width, sticker.height, sticker.rotation ?? 0, sticker.is_locked ?? 0, created_at, updated_at, sticker.user_id]
      );
    });
  }
}

export async function insertPageAudioFromRemote(audio: any): Promise<void> {
  const created_at = typeof audio.created_at === 'string' 
    ? Math.floor(new Date(audio.created_at).getTime() / 1000)
    : audio.created_at;
  
  const updated_at = typeof audio.updated_at === 'string'
    ? Math.floor(new Date(audio.updated_at).getTime() / 1000)
    : audio.updated_at;

  if (isAsync) {
    await runAsync(
      `INSERT OR REPLACE INTO page_audios(id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, created_at, updated_at, user_id)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [audio.id, audio.page_id, audio.audio_uri, audio.audio_type, audio.position_x, audio.position_y, audio.is_locked ?? 0, created_at, updated_at, audio.user_id]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx,
        `INSERT OR REPLACE INTO page_audios(id, page_id, audio_uri, audio_type, position_x, position_y, is_locked, created_at, updated_at, user_id)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [audio.id, audio.page_id, audio.audio_uri, audio.audio_type, audio.position_x, audio.position_y, audio.is_locked ?? 0, created_at, updated_at, audio.user_id]
      );
    });
  }
}


// ========== HARD DELETE FUNCTIONS (para sincronizacion) ==========

export async function hardDeletePageText(textId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM page_texts WHERE id = ?', [textId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_texts WHERE id = ?', [textId]);
    });
  }
}

export async function hardDeletePageDraw(drawId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM page_draws WHERE id = ?', [drawId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_draws WHERE id = ?', [drawId]);
    });
  }
}

export async function hardDeletePageShape(shapeId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM page_shapes WHERE id = ?', [shapeId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_shapes WHERE id = ?', [shapeId]);
    });
  }
}

export async function hardDeletePageSticker(stickerId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM page_stickers WHERE id = ?', [stickerId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_stickers WHERE id = ?', [stickerId]);
    });
  }
}

export async function hardDeletePageImage(imageId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM page_images WHERE id = ?', [imageId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_images WHERE id = ?', [imageId]);
    });
  }
}

export async function hardDeletePageAudio(audioId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM page_audios WHERE id = ?', [audioId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM page_audios WHERE id = ?', [audioId]);
    });
  }
}

export async function hardDeleteTask(taskId: string): Promise<void> {
  if (isAsync) {
    await runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, 'DELETE FROM tasks WHERE id = ?', [taskId]);
    });
  }
}