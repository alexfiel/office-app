"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PropertyTable } from "./PropertyTable"
import { DocumentInfo, RealPropertyInfo } from "@/lib/types/property"
import QRCode from "react-qr-code"
import { Printer, Save, FileCheck, RefreshCcw } from "lucide-react"


interface SummaryStepProps {
    documentInfo: DocumentInfo;
    transactionType: string;
    cart: RealPropertyInfo[];
    parties: { prevOwner: string; newOwner: string };
    computation: {
        taxBase: number;
        consideration: number; // Remove the '?' here
        taxDue: number;
        surcharge: number;
        interest: number;
        totalAmountDue: number;
        daysElapsed: number;
        validityDate: string;
    };
    isSuccess: boolean;
    savedTxId: string | null;
    isLoading: boolean;
    onSubmit: () => void;
    onReset: () => void;
    onBack: () => void;
}

// 2. Fix the function signature
export function SummaryStep({
    documentInfo,
    transactionType,
    cart,
    parties,
    computation,
    isSuccess,
    savedTxId,
    isLoading,
    onSubmit,
    onReset,
    onBack
}: SummaryStepProps) {

    const handlePrint = () => window.print();




    return (
        <Card className="print:border-none print:shadow-none pb-12 transition-all">
            <CardHeader className="print:hidden">
                <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    <CardTitle className="font-small-caps">FINAL COMPUTATION SUMMARY</CardTitle>
                </div>
                <CardDescription>REVIEW ALL DETAILS. ONCE SUBMITTED, YOU CAN PRINT THE OFFICIAL COMPUTATION SHEET.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
                {/* SUCCESS ALERT (Screen Only) */}
                {isSuccess && (
                    <div className="p-4 border border-green-200 bg-green-50 rounded-md print:hidden animate-in zoom-in duration-300">
                        <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                            ✅ TRANSACTION SAVED. YOU MAY NOW PRINT THE OFFICIAL COPY.
                        </p>
                    </div>
                )}

                {/* OFFICIAL HEADER (Print Only) */}
                <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
                    <div className="flex justify-between items-start">
                        <div className="text-left">
                            <h1 className="text-2xl font-bold uppercase tracking-widest">OFFICE OF THE CITY TREASURER</h1>
                            <h2 className="text-xl font-semibold mt-1 font-small-caps">Transfer Tax Computation Summary</h2>
                            <p className="text-xs mt-2 font-mono">DATE COMPUTED: {new Date().toLocaleDateString()}</p>
                        </div>
                        {savedTxId && (
                            <div className="flex flex-col items-center">
                                <QRCode value={savedTxId} size={80} level="M" />
                                <span className="text-[9px] mt-1 font-mono uppercase">REF: {savedTxId.slice(-8)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* PARTIES SECTION */}
                <div className="grid grid-cols-2 gap-8 border-b pb-6">
                    <div className="space-y-1">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Previous Owner (Transferor)</h3>
                        <p className="font-bold text-lg uppercase">{parties.prevOwner || "N/A"}</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">New Owner (Transferee)</h3>
                        <p className="font-bold text-lg uppercase">{parties.newOwner || "N/A"}</p>
                    </div>
                </div>

                {/* PROPERTIES TABLE */}
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Property Details</h3>
                    <PropertyTable properties={cart} />
                </div>

                {/* DOCUMENT & TRANSACTION INFO */}
                <div className="grid grid-cols-2 gap-8 bg-muted/20 p-4 rounded-lg border border-dashed">
                    <div className="text-xs space-y-2">
                        <h3 className="font-black uppercase text-muted-foreground">Document Reference</h3>
                        <p className="font-bold uppercase">{documentInfo.type}</p>
                        <p className="font-mono">DOC: {documentInfo.docNo} | PAGE: {documentInfo.pageNo} | BOOK: {documentInfo.bookNo}</p>
                        <p className="italic">NOTARIZED BY: {documentInfo.notarizedBy}</p>
                    </div>
                    <div className="text-xs space-y-2 text-right">
                        <h3 className="font-black uppercase text-muted-foreground">Transaction Details</h3>
                        <p className="font-bold uppercase">{transactionType}</p>
                        <div className="space-y-1">
                            <p className="font-mono">
                                NOTARIAL DATE: <span className="font-bold underline">
                                    {documentInfo.date ? new Date(documentInfo.date).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }).toUpperCase() : "N/A"}
                                </span>
                            </p>

                            <p className="font-mono text-primary font-bold">
                                DAYS ELAPSED: {computation.daysElapsed} DAYS
                            </p>
                        </div>
                        <p className="font-mono">VALIDITY: {computation.validityDate}</p>
                    </div>
                </div>

                {/* FINAL FINANCIALS */}
                <div className="flex flex-col items-end space-y-2 border-t pt-6">
                    <div className="w-full md:w-1/2 space-y-1">
                        {/* NEW: Conditional Consideration Row */}
                        {(transactionType === "DEED OF SALE" || transactionType === "CERTIFICATE OF SALE") && (
                            <div className="flex justify-between text-sm italic text-muted-foreground border-b border-dotted pb-1 mb-1">
                                <span className="font-small-caps">Contract Consideration:</span>
                                <span className="font-mono">
                                    P {(computation.consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm">
                            <span className="font-small-caps font-bold">Tax Base (Higher Value):</span>
                            <span className="font-mono font-bold">
                                P {computation.taxBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-small-caps">Basic Tax Due (0.75%):</span>
                            <span className="font-mono">P {computation.taxDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {computation.surcharge > 0 && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span className="font-small-caps">Surcharge (25%):</span>
                                <span className="font-mono">+ P {computation.surcharge.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {computation.interest > 0 && (
                            <div className="flex justify-between text-sm text-destructive">
                                <span className="font-small-caps">Interest (2% per Month):</span>
                                <span className="font-mono">+ P {computation.interest.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black border-t-2 border-black pt-2 mt-2">
                            <span className="font-small-caps">Total Amount Due:</span>
                            <span className="font-mono text-primary">P {(computation.totalAmountDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* PRINT-ONLY SIGNATURES */}
                <div className="hidden print:grid grid-cols-2 gap-20 mt-20">
                    <div className="border-t border-black pt-2">
                        <p className="text-[10px] font-bold uppercase">Prepared By:</p>
                        <p className="text-sm mt-4 font-bold uppercase underline">Internal User</p>
                    </div>
                    <div className="border-t border-black pt-2">
                        <p className="text-[10px] font-bold uppercase">Approved By:</p>
                        <p className="text-sm mt-4 font-bold">CITY TREASURER</p>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between print:hidden border-t pt-8">
                {!isSuccess ? (
                    <>
                        <Button variant="outline" onClick={onBack} disabled={isLoading}>BACK</Button>
                        <Button onClick={onSubmit} disabled={isLoading} className="min-w-[200px] font-bold">
                            {isLoading ? "SAVING..." : <><Save className="mr-2 h-4 w-4" /> SUBMIT TRANSACTION</>}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" onClick={onReset} className="font-bold">
                            <RefreshCcw className="mr-2 h-4 w-4" /> NEW TRANSACTION
                        </Button>
                        <Button onClick={handlePrint} className="min-w-[200px] font-bold bg-blue-600 hover:bg-blue-700">
                            <Printer className="mr-2 h-4 w-4" /> PRINT OFFICIAL COPY
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    )
}