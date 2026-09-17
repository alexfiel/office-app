import { RealPropertyInfo } from "./types/property";

const CART_KEY = "rpt-cart";
const TX_KEY = "transferTaxTransaction";
const DOC_KEY = "transferTaxDocument";

// Max cookie size allowed to prevent RFC 6265 4KB rejection and 431 Request Header Too Large
const MAX_SAFE_COOKIE_LENGTH = 3000;

function getStoredItem<T = any>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
        // 1. Check sessionStorage first (supports 5-10MB without size rejection)
        const sessionVal = sessionStorage.getItem(key);
        if (sessionVal) {
            return JSON.parse(sessionVal) as T;
        }

        // 2. Fallback to document.cookie (for backward compatibility and active transitions)
        const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
        if (match) {
            const parsed = JSON.parse(decodeURIComponent(match[2])) as T;
            // Migrate to sessionStorage
            sessionStorage.setItem(key, JSON.stringify(parsed));
            return parsed;
        }
    } catch (e) {
        console.error(`Error reading ${key} from storage:`, e);
    }
    return null;
}

function setStoredItem<T = any>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
        const json = JSON.stringify(value);
        // Primary: sessionStorage (no 5-property / 4KB limit)
        sessionStorage.setItem(key, json);

        // Secondary: Keep cookie in sync ONLY if it safely fits under the browser cookie limit
        const encoded = encodeURIComponent(json);
        if (encoded.length < MAX_SAFE_COOKIE_LENGTH) {
            document.cookie = `${key}=${encoded}; path=/`;
        } else {
            // Remove the cookie to avoid HTTP 431 Request Header Fields Too Large errors
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
    } catch (e) {
        console.error(`Error saving ${key} to storage:`, e);
    }
}

function removeStoredItem(key: string): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.removeItem(key);
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    } catch (e) {
        console.error(`Error clearing ${key} from storage:`, e);
    }
}

export const transferTaxStorage = {
    getCart: (): RealPropertyInfo[] => {
        const data = getStoredItem<RealPropertyInfo[]>(CART_KEY);
        return Array.isArray(data) ? data : [];
    },
    setCart: (cart: RealPropertyInfo[]): void => {
        setStoredItem(CART_KEY, cart);
    },
    clearCart: (): void => {
        removeStoredItem(CART_KEY);
    },

    getTransaction: (): any => {
        return getStoredItem(TX_KEY);
    },
    setTransaction: (tx: any): void => {
        setStoredItem(TX_KEY, tx);
    },
    clearTransaction: (): void => {
        removeStoredItem(TX_KEY);
    },

    getDocument: (): any => {
        return getStoredItem(DOC_KEY);
    },
    setDocument: (doc: any): void => {
        setStoredItem(DOC_KEY, doc);
    },
    clearDocument: (): void => {
        removeStoredItem(DOC_KEY);
    },

    clearAll: (): void => {
        removeStoredItem(CART_KEY);
        removeStoredItem(TX_KEY);
        removeStoredItem(DOC_KEY);
    }
};
