"use client";

import { useEffect } from "react";
import { SavedTransactionsCart } from "@/components/newTransfertax/SavedTransactionsCart";
import { transferTaxStorage } from "@/lib/transfertax-storage";

export default function NewTransferTaxLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // We use sessionStorage to determine if this is a completely fresh tab/browser session.
        // Modern browsers often preserve "session cookies" across tab closures (e.g., Chrome's "Continue where you left off").
        // By relying on sessionStorage (which is strictly tied to the tab's lifecycle), we guarantee
        // the storage is wiped if the user opens a new tab or restarts the browser.
        if (!sessionStorage.getItem("transferTaxActiveSession")) {
            transferTaxStorage.clearAll();
            sessionStorage.setItem("transferTaxActiveSession", "true");
        }
    }, []);

    return (
        <>
            {children}
            <SavedTransactionsCart />
        </>
    );
}
