"use client";

import { useEffect, useState } from "react";
import { getTransactionsByNotarialId } from "@/lib/actions/transfertax-actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, FileText, MapPin } from "lucide-react";

export function SavedTransactionsCart() {
    const [open, setOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [transactions, setTransactions] = useState<any[]>([]);
    const [documentId, setDocumentId] = useState<string | null>(null);

    // Initial check for cookie on mount
    useEffect(() => {
        const checkCookie = () => {
            try {
                const match = document.cookie.match(new RegExp('(^| )transferTaxDocument=([^;]+)'));
                if (match) {
                    const storedData = JSON.parse(decodeURIComponent(match[2]));
                    if (storedData.id) {
                        setDocumentId(storedData.id);
                    } else {
                        setDocumentId(null);
                    }
                } else {
                    setDocumentId(null);
                }
            } catch (e) {
                console.error("Failed to parse transferTaxDocument cookie", e);
            }
        };
        
        checkCookie();
        
        // Setup a small interval to check if cookie updates when continuing another transaction
        const interval = setInterval(checkCookie, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (open && documentId) {
            getTransactionsByNotarialId(documentId).then(res => {
                if (res.document && res.document.newTransferTaxes) {
                    setTransactions(res.document.newTransferTaxes);
                }
            });
        }
    }, [open, documentId]);

    // If no document ID exists yet (first transaction hasn't been saved), don't show the cart
    if (!documentId) return null;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button 
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 transition-all z-50 p-0"
                    aria-label="View Saved Transactions"
                >
                    <div className="relative">
                        <ShoppingCart className="h-6 w-6 text-white" />
                        {transactions.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                                {transactions.length}
                            </span>
                        )}
                    </div>
                </Button>
            </SheetTrigger>
            
            <SheetContent className="w-full sm:max-w-md bg-gray-50 flex flex-col h-full border-l">
                <SheetHeader className="px-1 py-4 border-b">
                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Saved Transactions
                    </SheetTitle>
                    <p className="text-sm text-gray-500">
                        Transactions attached to the current Notarial Document.
                    </p>
                </SheetHeader>
                
                <div className="flex-1 -mx-6 px-6 overflow-y-auto">
                    <div className="py-6 space-y-4">
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <p>No transactions saved yet.</p>
                            </div>
                        ) : (
                            transactions.map((tx, idx) => (
                                <div key={tx.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                                    <div className="flex justify-between items-start border-b pb-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Control No</span>
                                            <p className="text-sm font-mono font-bold text-gray-800">{tx.t_controlNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Amount Due</span>
                                            <p className="text-sm font-bold text-emerald-600">
                                                ₱{Number(tx.t_TotalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        <div className="flex text-sm">
                                            <span className="w-20 text-gray-500 font-medium">Transferor:</span>
                                            <span className="flex-1 font-semibold text-gray-800 truncate">
                                                {Array.from(new Set(tx.t_transfertaxdetails.map((d: any) => d.nt_transferror))).join(" / ") || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex text-sm">
                                            <span className="w-20 text-gray-500 font-medium">Transferee:</span>
                                            <span className="flex-1 font-semibold text-gray-800 truncate">
                                                {Array.from(new Set(tx.t_transfertaxdetails.map((d: any) => d.nt_transferee))).join(" / ") || "N/A"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> Properties Included
                                        </p>
                                        <div className="space-y-1">
                                            {tx.t_transfertaxdetails.map((dt: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 p-1.5 rounded border border-gray-100">
                                                    <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-medium">
                                                        Lot: {dt.realProperty?.lotNumber || dt.nt_lotnumber || "N/A"}
                                                    </span>
                                                    <span className="text-gray-600 truncate">
                                                        MV: ₱{Number(dt.nt_marketvalue).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="mt-auto border-t py-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-500">Total Transactions:</span>
                        <span className="font-bold text-gray-900">{transactions.length}</span>
                    </div>
                    <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700" 
                        onClick={() => {
                            setOpen(false);
                            window.location.href = `/newTransferTax/summary/${documentId}`;
                        }}
                    >
                        View Full Summary
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
