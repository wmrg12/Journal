// src/db/repo.ts
import * as SQLite from "expo-sqlite";

let db: any | null = null;

async function ensureDb() {
  if (db) return;
  const anySQLite = SQLite as any;

  // Fuerza legacy aunque exista openDatabaseAsync
  if (typeof anySQLite.openDatabase === "function") {
    db = anySQLite.openDatabase("journal.db");
    await new Promise<void>((resolve) =>
      db.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, () => resolve())
    );
    return;
  }
  throw new Error("expo-sqlite (legacy) no disponible.");
}

function txRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        () => resolve(),
        (_: any, err: any) => (reject(err), true)
      );
    });
  });
}

function txAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
      tx.executeSql(
        sql,
        params,
        (_: any, { rows }: any) => resolve(rows._array as T[]),
        (_: any, err: any) => (reject(err), true)
      );
    });
  });
}

export async function ensureSchema() {
  await ensureDb();
  await txRun(`CREATE TABLE IF NOT EXISTS journals(
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );`);
  await txRun(`CREATE TABLE IF NOT EXISTS pages(
    id TEXT PRIMARY KEY NOT NULL,
    journal_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    bg_color TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
  );`);
  await txRun(`CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`);
}

export async function upsertJournal(j: {
  id: string; name: string; color: string; is_favorite?: 0 | 1; created_at?: number;
}) {
  await ensureSchema();
  const now = j.created_at ?? Date.now();
  await txRun(
    `INSERT OR IGNORE INTO journals (id, name, color, is_favorite, created_at)
     VALUES (?, ?, ?, COALESCE(?,0), ?)`,
    [j.id, j.name, j.color, j.is_favorite ?? 0, now]
  );
  await txRun(
    `UPDATE journals SET name = ?, color = ?, is_favorite = COALESCE(?, is_favorite) WHERE id = ?`,
    [j.name, j.color, j.is_favorite, j.id]
  );
}

export async function upsertPage(p: {
  id: string; journal_id: string; page_number: number; bg_color: string; created_at?: number;
}) {
  await ensureSchema();
  const now = p.created_at ?? Date.now();
  await txRun(
    `INSERT OR REPLACE INTO pages (id, journal_id, page_number, bg_color, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [p.id, p.journal_id, p.page_number, p.bg_color, now]
  );
}

export async function listJournals() {
  await ensureSchema();
  return txAll<{ id: string; name: string; color: string; is_favorite: number; created_at: number }>(
    `SELECT * FROM journals ORDER BY created_at DESC`
  );
}
