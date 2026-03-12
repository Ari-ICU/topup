"use client";

/**
 * Transaction History Helper
 * Saves and retrieves recent transactions from localStorage.
 */

export interface HistoryItem {
    id: string;
    gameName: string;
    packageName: string;
    amount: number;
    status: string;
    date: string;
}

const STORAGE_KEY = "DAI_GAME_HISTORY_V1";
const MAX_ITEMS = 15;

export const historyService = {
    // Add a new transaction to the top of the history
    add: (item: Omit<HistoryItem, "date">) => {
        if (typeof window === "undefined") return;

        try {
            const current = historyService.getAll();
            const newItem: HistoryItem = {
                ...item,
                date: new Date().toISOString()
            };

            // Remove duplicates if same ID exists
            const filtered = current.filter(h => h.id !== item.id);
            const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error("[HistoryService] Failed to add item:", err);
        }
    },

    // Update status of an existing transaction
    updateStatus: (id: string, status: string) => {
        if (typeof window === "undefined") return;

        try {
            const current = historyService.getAll();
            const updated = current.map(h => h.id === id ? { ...h, status } : h);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
            console.error("[HistoryService] Failed to update item:", err);
        }
    },

    // Get all items
    getAll: (): HistoryItem[] => {
        if (typeof window === "undefined") return [];

        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.error("[HistoryService] Failed to read history:", err);
            return [];
        }
    },

    // Clear history
    clear: () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(STORAGE_KEY);
    }
};
