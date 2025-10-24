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

      // ---- MIGRACIONES ----
      await execTxIgnore(
        tx,
        `ALTER TABLE journals ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
      );
      await execTxIgnore(
        tx,
        `ALTER TABLE pages ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
      );

      // Índices
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

    });

    return;
  }

  // -------- ASYNC (openDatabaseAsync) --------
  if (typeof anySQLite.openDatabaseAsync === "function") {
    adb = await anySQLite.openDatabaseAsync("journal.db");
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

    // ---- MIGRACIONES ----
    await runAsyncIgnore(
      `ALTER TABLE journals ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
    );
    await runAsyncIgnore(
      `ALTER TABLE pages ADD COLUMN updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))`
    );

    // Índices
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`
    );
    await runAsync(
      `CREATE INDEX IF NOT EXISTS idx_pages_journal_number ON pages(journal_id, page_number);`
    );
    await runAsync(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_pages_journal_number ON pages(journal_id, page_number);`
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
  } catch {
  }
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
  } catch {

  }
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

// ---------- DAO: Journals ----------
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