"use client";

import { useEffect } from "react";

export default function NewTransferTaxLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // We use sessionStorage to determine if this is a completely fresh tab/browser session.
        // Modern browsers often preserve "session cookies" across tab closures (e.g., Chrome's "Continue where you left off").
        // By relying on sessionStorage (which is strictly tied to the tab's lifecycle), we guarantee
        // the cookies are wiped if the user opens a new tab or restarts the browser.
        if (!sessionStorage.getItem("transferTaxActiveSession")) {
            document.cookie = "transferTaxDocument=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "rpt-cart=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "transferTaxTransaction=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            
            sessionStorage.setItem("transferTaxActiveSession", "true");
        }
    }, []);

    return <>{children}</>;
}
