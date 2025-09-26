import * as SQLite from "expo-sqlite";

let legacyDb: any;

export async function initDb() {
    const anySQLite = SQLite as any;

    if (typeof anySQLite.openDatabase === "function") {
    legacyDb = anySQLite.openDatabase("journal.db");

    legacyDb.exec([{ sql: "PRAGMA foreign_keys = ON;", args: [] }], false, () => {});

    legacyDb.transaction((tx: any) => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS journals(
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
        );`);

        tx.executeSql(`CREATE TABLE IF NOT EXISTS pages(
        id TEXT PRIMARY KEY NOT NULL,
        journal_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        bg_color TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
        );`);

        tx.executeSql(`CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`);
    });

    return;
    }

    if (typeof anySQLite.openDatabaseAsync === "function") {
    const adb: any = await anySQLite.openDatabaseAsync("journal.db");

    await adb.execAsync("PRAGMA foreign_keys = ON;");
    await adb.execAsync(`CREATE TABLE IF NOT EXISTS journals(
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
    );`);
    await adb.execAsync(`CREATE TABLE IF NOT EXISTS pages(
        id TEXT PRIMARY KEY NOT NULL,
        journal_id TEXT NOT NULL,
        page_number INTEGER NOT NULL,
        bg_color TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(journal_id) REFERENCES journals(id) ON DELETE CASCADE
    );`);
    await adb.execAsync(`CREATE INDEX IF NOT EXISTS idx_pages_journal ON pages(journal_id);`);

    return;
    }

    throw new Error(
    "expo-sqlite no disponible (ni legacy ni async). Reinstala con: npx expo install expo-sqlite"
    );
}
