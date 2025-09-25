import * as SQLite from 'expo-sqlite';
const db = (SQLite as any).openDatabase("journal.db");

export function initDb() {
    db.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, () => {});

    db.transaction((tx: any) => {   //journals
    tx.executeSql(`CREATE TABLE IF NOT EXISTS journals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
    );`);

    //pages
    tx.executeSql(`CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY NOT NULL,
        journal_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        bg_color TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
    );`);

    tx.executeSql(
        `CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`
    );
    });
}




