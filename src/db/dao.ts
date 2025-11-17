// src/db/dao.ts
import * as SQLite from "expo-sqlite";
import * as Crypto from "expo-crypto";

let legacyDb: any = null;
let adb: any = null;
let isAsync = false;

export async function initDb() {
  const anySQLite = SQLite as any;

  // -------- LEGACY (openDatabase) --------
  if (typeof anySQLite.openDatabase === "function") {
    legacyDb = anySQLite.openDatabase("journal.db");
    isAsync = false;

    // PRAGMA FK
    await new Promise<void>((resolve) => {
      (legacyDb as any).exec?.(
        [{ sql: "PRAGMA foreign_keys = ON;", args: [] }],
        false,
        () => resolve()
      ) ?? resolve();
    });

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
        );`
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
        );`
      );

      await execTx(
        tx,
        `CREATE TABLE IF NOT EXISTS tasks(
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0,1)),
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );`
      );

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
        );`
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
        );`
      );
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_page_draws_page ON page_draws(page_id);`
      );


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
        );`
      );
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_page_shapes_page ON page_shapes(page_id);`
      );

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
        );`
      );
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_page_stickers_page ON page_stickers(page_id);`
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
        );`
      );
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_id);`
      );

      // ---- MIGRACIONES ----
      await execTxIgnore(
        tx,
        `ALTER TABLE journals ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
      );
      await execTxIgnore(
        tx,
        `ALTER TABLE pages ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
      );
      await execTxIgnore(
        tx,
        `ALTER TABLE page_texts ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1))`
      );
      await execTxIgnore(
        tx,
        `ALTER TABLE page_texts ADD COLUMN rotation REAL NOT NULL DEFAULT 0`
      );

      // Migraciones para page_shapes 
      await execTxIgnore(
        tx,
        `ALTER TABLE page_shapes ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0`
      );
      await execTxIgnore(
        tx,
        `ALTER TABLE page_shapes ADD COLUMN rotation REAL NOT NULL DEFAULT 0`
      );

      // Índices adicionales
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`
      );
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_pages_journal_number ON pages(journal_id, page_number);`
      );
      await execTx(
        tx,
        `CREATE UNIQUE INDEX IF NOT EXISTS ux_pages_journal_number ON pages(journal_id, page_number);`
      );

      // Indice para textos
      await execTx(
        tx,
        `CREATE INDEX IF NOT EXISTS idx_page_texts_page ON page_texts(page_id);`
      );
    });

    return;
  }

  // -------- ASYNC (openDatabaseAsync) --------
  if (typeof anySQLite.openDatabaseAsync === "function") {
    adb = await anySQLite.openDatabaseAsync("journalin.db");
    isAsync = true;

    await (adb as any).execAsync?.("PRAGMA foreign_keys = ON;");

    // Tablas base
    await runAsync(
      `CREATE TABLE IF NOT EXISTS journals(
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0 CHECK(is_favorite IN (0,1)),
        created_at INTEGER NOT NULL
      );`
    );

    await runAsync(
      `CREATE TABLE IF NOT EXISTS pages(
        id TEXT PRIMARY KEY NOT NULL,
        journal_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        bg_color TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
      );`
    );

    await runAsync(
      `CREATE TABLE IF NOT EXISTS tasks(
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0,1)),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );`
    );

    // Tabla para textos en páginas
    await runAsync(
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
      );`
    );

    // tablas para trazos en dibujo
    await runAsync(
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
      );`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_page_draws_page ON page_draws(page_id);`
    );

    // Tabla de formas geometricas
    await runAsync(
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
      );`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_page_shapes_page ON page_shapes(page_id);`
    );

    // tablas de stickers
    await runAsync(
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
      );`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_page_stickers_page ON page_stickers(page_id);`
    );

    // tabla para imagenes
    await runAsync(
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
      );`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_page_images_page ON page_images(page_id);`
    );

    // ---- MIGRACIONES ----
    await runAsyncIgnore(
      `ALTER TABLE journals ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
    );
    await runAsyncIgnore(
      `ALTER TABLE pages ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
    );
    await runAsyncIgnore(
      `ALTER TABLE page_texts ADD COLUMN is_locked INTEGER NOT NULL DEFAULT 0 CHECK(is_locked IN (0,1))`
    );
    await runAsyncIgnore(
      `ALTER TABLE page_texts ADD COLUMN rotation REAL NOT NULL DEFAULT 0`
    );

    // Indices
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_pages_journal_number ON pages(journal_id, page_number);`
    );
    await runAsync(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_pages_journal_number ON pages(journal_id, page_number);`
    );

    // Indice para textos
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_page_texts_page ON page_texts(page_id);`
    );

    return;
  }

  throw new Error(
    "expo-sqlite no disponible. Instala: npx expo install expo-sqlite"
  );
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
      }
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
  if (!adb) throw new Error("DB async no inicializada");
  if (typeof (adb as any).runAsync === "function") {
    await (adb as any).runAsync(sql, params);
  } else if (
    params.length === 0 &&
    typeof (adb as any).execAsync === "function"
  ) {
    await (adb as any).execAsync(sql);
  } else {
    throw new Error(
      "Método runAsync/execAsync no disponible para consultas parametrizadas"
    );
  }
}

async function runAsyncIgnore(sql: string, params: any[] = []) {
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
      () => resolve(undefined as unknown as T)
    );
  });
}

// ========== DAO: Journals ==========
export async function createJournal(name: string, color: string) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO journals(id, name, color, is_favorite, created_at, updated_at)
       VALUES(?,?,?,?,?,?)`,
      [id, name, color, 0, now, now]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO journals(id, name, color, is_favorite, created_at, updated_at)
         VALUES(?,?,?,?,?,?)`,
        [id, name, color, 0, now, now]
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
         ORDER BY created_at DESC`
    );
    return rows ?? [];
  }

  return new Promise<Journal[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, name, color, is_favorite, created_at, updated_at
           FROM journals
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
        }
      );
    });
  });
}

export async function toggleFavorite(journalId: string, favorite: boolean) {
  const value = favorite ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `UPDATE journals SET is_favorite = ?, updated_at = ? WHERE id = ?`,
      [value, now, journalId]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `UPDATE journals SET is_favorite = ?, updated_at = ? WHERE id = ?`,
        [value, now, journalId]
      );
    });
  }
}

export async function deleteJournal(journalId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM journals WHERE id = ?`, [journalId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM journals WHERE id = ?`, [journalId]);
    });
  }
}

// ---------- DAO: Update Journal Cover ----------
export async function updateJournalCover(
  journalId: string,
  updates: {
    name?: string;
    color?: string;
  }
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(now);
  values.push(journalId);

  const sql = `UPDATE journals SET ${fields.join(", ")} WHERE id = ?`;

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
      `SELECT COALESCE(MAX(page_number),0) AS total FROM pages WHERE journal_id = ?`,
      [journalId]
    );
    return rows?.[0]?.total ?? 0;
  }

  return new Promise<number>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT COALESCE(MAX(page_number),0) AS total FROM pages WHERE journal_id = ?`,
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

export async function getPageId(
  journalId: string,
  pageNumber: number
): Promise<string | null> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id FROM pages WHERE journal_id = ? AND page_number = ? LIMIT 1`,
      [journalId, pageNumber]
    );
    return rows?.[0]?.id ?? null;
  }

  return new Promise<string | null>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id FROM pages WHERE journal_id = ? AND page_number = ? LIMIT 1`,
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

export async function getPageColor(
  journalId: string,
  pageNumber: number
): Promise<string | null> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT bg_color
         FROM pages
        WHERE journal_id = ? AND page_number = ?
        LIMIT 1`,
      [journalId, pageNumber]
    );
    return rows?.[0]?.bg_color ?? null;
  }

  return new Promise<string | null>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT bg_color
           FROM pages
          WHERE journal_id = ? AND page_number = ?
          LIMIT 1`,
        [journalId, pageNumber],
        (_: any, res: any) => {
          resolve(
            res.rows.length ? (res.rows.item(0).bg_color as string) : null
          );
        },
        (_: any, err: any) => {
          reject(err);
          return true;
        }
      );
    });
  });
}

export async function createPage(journalId: string, bgColor: string) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync("BEGIN");
    try {
      const rows = await (adb as any).getAllAsync?.(
        `SELECT COALESCE(MAX(page_number),0)+1 AS next FROM pages WHERE journal_id = ?`,
        [journalId]
      );
      const next = rows?.[0]?.next ?? 1;

      await runAsync(
        `INSERT INTO pages(id, journal_id, page_number, bg_color, created_at, updated_at)
         VALUES(?,?,?,?,?,?)`,
        [id, journalId, next, bgColor, now, now]
      );

      await runAsync("COMMIT");
      return { pageNumber: next, total: next };
    } catch (e) {
      await runAsync("ROLLBACK");
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
        }
      );
    });

    await execTx(
      tx,
      `INSERT INTO pages(id, journal_id, page_number, bg_color, created_at, updated_at)
       VALUES(?,?,?,?,?,?)`,
      [id, journalId, next, bgColor, now, now]
    );
  });

  return { pageNumber: next, total: next };
}

export async function deletePage(journalId: string, pageNumber: number) {
  if (pageNumber < 1) return { pageNumber: 1, total: 1 };

  if (isAsync) {
    await runAsync("BEGIN");
    try {
      await runAsync(
        `DELETE FROM pages WHERE journal_id = ? AND page_number = ?`,
        [journalId, pageNumber]
      );

      await runAsync(
        `UPDATE pages
           SET page_number = page_number - 1,
               updated_at   = ?
         WHERE journal_id = ? AND page_number > ?`,
        [Math.floor(Date.now() / 1000), journalId, pageNumber]
      );

      await runAsync("COMMIT");

      const rows = await (adb as any).getAllAsync?.(
        `SELECT COALESCE(MAX(page_number),0) AS total FROM pages WHERE journal_id = ?`,
        [journalId]
      );
      const total = Math.max(rows?.[0]?.total ?? 0, 0);
      const target = Math.max(Math.min(pageNumber, total), 1);

      return { pageNumber: Math.max(target, 1), total: Math.max(total, 1) };
    } catch (e) {
      await runAsync("ROLLBACK");
      throw e;
    }
  }

  // Legacy
  await txLegacy(async (tx) => {
    await execTx(
      tx,
      `DELETE FROM pages WHERE journal_id = ? AND page_number = ?`,
      [journalId, pageNumber]
    );
    await execTx(
      tx,
      `UPDATE pages
         SET page_number = page_number - 1,
             updated_at   = ?
       WHERE journal_id = ? AND page_number > ?`,
      [Math.floor(Date.now() / 1000), journalId, pageNumber]
    );
  });

  const total = await getTotalPages(journalId);
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
  isLocked?: number
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_texts(id, page_id, content, font_family, color, position_x, position_y, font_size, rotation, is_locked, created_at, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        now,
        now,
      ]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_texts(id, page_id, content, font_family, color, position_x, position_y, font_size, rotation, is_locked, created_at, updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
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
          now,
          now,
        ]
      );
    });
  }
  return { id };
}

export async function listPageTexts(pageId: string): Promise<PageText[]> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT id, page_id, content, font_family, color, position_x, position_y, font_size, created_at, updated_at, is_locked, rotation
         FROM page_texts
        WHERE page_id = ?
        ORDER BY created_at ASC`,
      [pageId],
    );
    return rows ?? [];
  }

  return new Promise<PageText[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, content, font_family, color, position_x, position_y, font_size, created_at, updated_at, is_locked, rotation
           FROM page_texts
          WHERE page_id = ?
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
  },
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.content !== undefined) {
    fields.push("content = ?");
    values.push(updates.content);
  }
  if (updates.font_family !== undefined) {
    fields.push("font_family = ?");
    values.push(updates.font_family);
  }
  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }
  if (updates.position_x !== undefined) {
    fields.push("position_x = ?");
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push("position_y = ?");
    values.push(updates.position_y);
  }
  if (updates.font_size !== undefined) {
    fields.push("font_size = ?");
    values.push(updates.font_size);
  }
  if (updates.is_locked !== undefined) {
    fields.push("is_locked = ?");
    values.push(updates.is_locked);
  }
  if (updates.rotation !== undefined) {
    fields.push("rotation = ?");
    values.push(updates.rotation);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(now);
  values.push(textId);

  const sql = `UPDATE page_texts SET ${fields.join(", ")} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function deletePageText(textId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM page_texts WHERE id = ?`, [textId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM page_texts WHERE id = ?`, [textId]);
    });
  }
}

// ---------- DAO: Page forms (shapes) --------
export type ShapeType =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "heart"
  | "rectangle"
  | "line"
  | "arrow"
  | "diamond"
  | "pentagon"
  | "sun"
  | "bolt"
  | "flower"
  | "mountain";

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
  height: number = 100
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_shapes(id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      ]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_shapes(id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        ]
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
        WHERE page_id = ?
        ORDER BY created_at ASC`,
      [pageId]
    );
    return rows ?? [];
  }

  return new Promise<PageShape[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, shape_type, color, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at
            FROM page_shapes
          WHERE page_id = ?
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
        }
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
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }
  if (updates.position_x !== undefined) {
    fields.push("position_x = ?");
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push("position_y = ?");
    values.push(updates.position_y);
  }
  if (updates.width !== undefined) {
    fields.push("width = ?");
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push("height = ?");
    values.push(updates.height);
  }
  if (updates.rotation !== undefined) {
    fields.push("rotation = ?");
    values.push(updates.rotation);
  }
  if (updates.is_locked !== undefined) {
    fields.push("is_locked = ?");
    values.push(updates.is_locked);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(now);
  values.push(shapeId);

  const sql = `UPDATE page_shapes SET ${fields.join(", ")} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function deletePageShape(shapeId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM page_shapes WHERE id = ?`, [shapeId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM page_shapes WHERE id = ?`, [shapeId]);
    });
  }
}

// ========== DAO: Page Draws (Dibujos) ==========
export type PageDraw = {
  id: string;
  page_id: string;
  path_d: string; // Cadena SVG path
  color: string;
  width: number;
  opacity: number;
  tool: "pencil" | "pen" | "marker";
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
  tool: "pencil" | "pen" | "marker",
  orderIndex?: number
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    if (orderIndex == null) {
      const rows = await (adb as any).getAllAsync?.(
        `SELECT COALESCE(MAX(order_index), 0) + 1 AS next FROM page_draws WHERE page_id = ?`,
        [pageId]
      );
      orderIndex = rows?.[0]?.next ?? 1;
    }

    await runAsync(
      `INSERT INTO page_draws(id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id, pageId, pathD, color, width, opacity, tool, orderIndex, now, now]
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
            }
          );
        });
      }

      await execTx(
        tx,
        `INSERT INTO page_draws(id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [id, pageId, pathD, color, width, opacity, tool, orderIndex, now, now]
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
       WHERE page_id = ?
       ORDER BY order_index ASC, created_at ASC`,
      [pageId]
    );
    return rows ?? [];
  }

  return new Promise<PageDraw[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, path_d, color, width, opacity, tool, order_index, created_at, updated_at
         FROM page_draws
         WHERE page_id = ?
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
        }
      );
    });
  });
}

export async function deletePageDraw(drawId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM page_draws WHERE id = ?`, [drawId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM page_draws WHERE id = ?`, [drawId]);
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
  height: number = 100
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      ]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_stickers(id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        ]
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
       WHERE page_id = ?
       ORDER BY created_at ASC`,
      [pageId]
    );
    return rows ?? [];
  }

  return new Promise<PageSticker[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, sticker_url, sticker_category, position_x, position_y, width, height, rotation, is_locked, created_at, updated_at
         FROM page_stickers
         WHERE page_id = ?
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
        }
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
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.position_x !== undefined) {
    fields.push("position_x = ?");
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push("position_y = ?");
    values.push(updates.position_y);
  }
  if (updates.width !== undefined) {
    fields.push("width = ?");
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push("height = ?");
    values.push(updates.height);
  }
  if (updates.rotation !== undefined) {
    fields.push("rotation = ?");
    values.push(updates.rotation);
  }
  if (updates.is_locked !== undefined) {
    fields.push("is_locked = ?");
    values.push(updates.is_locked);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(now);
  values.push(stickerId);

  const sql = `UPDATE page_stickers SET ${fields.join(", ")} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function duplicatePageSticker(
  stickerId: string
): Promise<{ id: string } | null> {
  let originalSticker: PageSticker | null = null;

  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT * FROM page_stickers WHERE id = ? LIMIT 1`,
      [stickerId]
    );
    originalSticker = rows?.[0] ?? null;
  } else {
    originalSticker = await new Promise<PageSticker | null>(
      (resolve, reject) => {
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
            }
          );
        });
      }
    );
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
      ]
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
        ]
      );
    });
  }

  return { id: newId };
}

export async function deletePageSticker(stickerId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM page_stickers WHERE id = ?`, [stickerId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM page_stickers WHERE id = ?`, [stickerId]);
    });
  }
}

export async function toggleStickerLock(stickerId: string, locked: boolean) {
  const value = locked ? 1 : 0;
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `UPDATE page_stickers SET is_locked = ?, updated_at = ? WHERE id = ?`,
      [value, now, stickerId]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `UPDATE page_stickers SET is_locked = ?, updated_at = ? WHERE id = ?`,
        [value, now, stickerId]
      );
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

export async function getPageSticker(
  stickerId: string
): Promise<PageSticker | null> {
  if (isAsync) {
    const rows = await (adb as any).getAllAsync?.(
      `SELECT * FROM page_stickers WHERE id = ? LIMIT 1`,
      [stickerId]
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
        }
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
  uri: string,
  positionX: number,
  positionY: number,
  width: number = 100,
  height: number = 100
) {
  const id = await Crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  if (isAsync) {
    await runAsync(
      `INSERT INTO page_images(id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?)`,
      [id, pageId, uri, positionX, positionY, width, height, 0, now, now]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO page_images(id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at)
         VALUES(?,?,?,?,?,?,?,?,?,?)`,
        [id, pageId, uri, positionX, positionY, width, height, 0, now, now]
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
        WHERE page_id = ?
        ORDER BY created_at ASC`,
      [pageId]
    );
    return rows ?? [];
  }

  return new Promise<PageImage[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, page_id, uri, position_x, position_y, width, height, rotation, created_at, updated_at
           FROM page_images
          WHERE page_id = ?
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
        }
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
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.uri !== undefined) {
    fields.push("uri = ?");
    values.push(updates.uri);
  }
  if (updates.position_x !== undefined) {
    fields.push("position_x = ?");
    values.push(updates.position_x);
  }
  if (updates.position_y !== undefined) {
    fields.push("position_y = ?");
    values.push(updates.position_y);
  }
  if (updates.width !== undefined) {
    fields.push("width = ?");
    values.push(updates.width);
  }
  if (updates.height !== undefined) {
    fields.push("height = ?");
    values.push(updates.height);
  }
  if (updates.rotation !== undefined) {
    fields.push("rotation = ?");
    values.push(updates.rotation);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(now);
  values.push(imageId);

  const sql = `UPDATE page_images SET ${fields.join(", ")} WHERE id = ?`;

  if (isAsync) {
    await runAsync(sql, values);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, sql, values);
    });
  }
}

export async function deletePageImage(imageId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM page_images WHERE id = ?`, [imageId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM page_images WHERE id = ?`, [imageId]);
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
      `INSERT INTO tasks(id, title, is_completed, created_at, updated_at)
        VALUES(?,?,?,?,?)`,
      [id, title, 0, now, now]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `INSERT INTO tasks(id, title, is_completed, created_at, updated_at)
          VALUES(?,?,?,?,?)`,
        [id, title, 0, now, now]
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
        ORDER BY is_completed ASC, created_at ASC`
    );
    return rows ?? [];
  }

  return new Promise<Task[]>((resolve, reject) => {
    legacyDb.readTransaction((tx: any) => {
      tx.executeSql(
        `SELECT id, title, is_completed, created_at, updated_at
            FROM tasks
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
        }
      );
    });
  });
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    is_completed?: boolean;
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.is_completed !== undefined) {
    fields.push("is_completed = ?");
    values.push(updates.is_completed ? 1 : 0);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = ?");
  values.push(now);
  values.push(taskId);

  const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;

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
    await runAsync(
      `UPDATE tasks SET is_completed = ?, updated_at = ? WHERE id = ?`,
      [value, now, taskId]
    );
  } else {
    await txLegacy(async (tx) => {
      await execTx(
        tx,
        `UPDATE tasks SET is_completed = ?, updated_at = ? WHERE id = ?`,
        [value, now, taskId]
      );
    });
  }
}

export async function deleteTask(taskId: string) {
  if (isAsync) {
    await runAsync(`DELETE FROM tasks WHERE id = ?`, [taskId]);
  } else {
    await txLegacy(async (tx) => {
      await execTx(tx, `DELETE FROM tasks WHERE id = ?`, [taskId]);
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
  images?: PageImage[]; // opcional
  stickers?: PageSticker[]; // opcional
};

export async function getPageSnapshot(
  journalId: string,
  pageNumber: number
): Promise<PageSnapshot | null> {
  // 1. Obtenemos el ID de la página
  const pageId = await getPageId(journalId, pageNumber);
  if (!pageId) {
    return null; // no existe esa página
  }

  const bg_color = await getPageColor(journalId, pageNumber);

  const [texts, shapes, draws, images, stickers] = await Promise.all([
    listPageTexts(pageId),
    listPageShapes(pageId),
    listPageDraws(pageId),
    listPageImages(pageId),
    listPageStickers(pageId),
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
  };
}