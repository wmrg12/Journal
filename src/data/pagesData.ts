import * as SQLite from "expo-sqlite";
import "react-native-get-random-values";
import { v4 as uuid } from "uuid";


const db = (SQLite as any).openDatabase("journal.db");

export type PageRecord = {
    id: string;
    journal_id: string;
    page_number: number;
    bg_color: string;
    created_at: number;
};

export function getNextPageNumber(journalId: string): Promise<number> {
    return new Promise((resolve, reject) => {
    db.readTransaction((tx: any) => {
        tx.executeSql(
        `SELECT IFNULL(MAX(page_number), 0) + 1 AS nextNum
        FROM pages WHERE journal_id = ?`,
        [journalId],
        (_: any, { rows }: any) => resolve(rows.item(0).nextNum as number),
        (_: any, err: any) => { reject(err); return false; }
        );
    });
    });
}

export async function createPage(journalId: string, bgColor: string): Promise<PageRecord> {
    const id = uuid();
    const created_at = Date.now();
    const page_number = await getNextPageNumber(journalId);

    return new Promise((resolve, reject) => {
    db.transaction((tx: any) => {
        tx.executeSql(
        `INSERT INTO pages (id, journal_id, page_number, bg_color, created_at)
        VALUES (?, ?, ?, ?, ?)`,
        [id, journalId, page_number, bgColor, created_at],
        () =>
            resolve({ id, journal_id: journalId, page_number, bg_color: bgColor, created_at }),
        (_: any, err: any) => { reject(err); return false; }
        );
    });
    });
}

