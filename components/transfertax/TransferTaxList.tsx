"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import QRCode from "react-qr-code"
import InvoicePreview from "@/components/invoice/invoice-preview"

type TransferTaxRecord = {
    id: string;
    transferee: string;
    transferor: string;
    transactionType: string;
    considerationvalue: number;
    totalmarketvalue: number;
    taxbase: number;
    taxdue: number;
    surcharge: number;
    interest: number;
    totalamountdue: number;
    paymentstatus: string;
    transactionDate: string;
    validuntil: string;
    dayselapsed: number;
    createdAt: string;
    userId: string;
    details?: any[];
    notarialDocument?: {
        document_url: string;
        documentNumber?: string;
        documentType?: string;
        notarizedBy?: string;
        notarialDate?: string;
    };
    user?: {
        name: string;
    }
}

export default function TransferTaxList({ currentUser }: { currentUser: any }) {
    const [data, setData] = useState<TransferTaxRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState<TransferTaxRecord | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);

    const handlePreview = () => {
        if (!selectedItem) return;

        const docNum = selectedItem.notarialDocument?.documentNumber || "";
        const parsedDocNo = docNum.split(",")[0]?.replace("Doc: ", "") || "N/A";
        const parsedPageNo = docNum.split(",")[1]?.replace(" Page: ", "") || "N/A";
        const parsedBookNo = docNum.split(",")[2]?.replace(" Book: ", "") || "N/A";

        setPreviewData({
                transferee: selectedItem.transferee || "JUAN DELA CRUZ",
                transferor: selectedItem.transferor || "JUAN DELA CRUZ",
                computationDate: new Date(selectedItem.transactionDate).toLocaleDateString(),
                validityDate: selectedItem.validuntil || "N/A",
                transactionId: selectedItem.id,
                qrValue: `ID: ${selectedItem.id}\nNew Owner: ${selectedItem.transferee}\nAmount Due: P ${Number(selectedItem.totalamountdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nValidity Date: ${selectedItem.validuntil || "N/A"}`,
                properties: selectedItem.details ? selectedItem.details.map((d: any) => ({
                    tdNo: d.taxdecnumber,
                    lotNo: d.lotNumber,
                    marketValue: d.marketValue
                })) : [],
                totalMarketValue: selectedItem.totalmarketvalue,
                documentInfo: {
                    type: selectedItem.notarialDocument?.documentType || "N/A",
                    docNo: parsedDocNo,
                    pageNo: parsedPageNo,
                    bookNo: parsedBookNo,
                    notarizedBy: selectedItem.notarialDocument?.notarizedBy || "N/A",
                    date: selectedItem.notarialDocument?.notarialDate ? new Date(selectedItem.notarialDocument.notarialDate).toLocaleDateString() : "N/A",
                },
                transactionInfo: {
                    type: selectedItem.transactionType,
                    consideration: selectedItem.considerationvalue,
                    dayselapsed: selectedItem.dayselapsed || 0,
                    validityDate: selectedItem.validuntil,
                },
                computation: {
                    taxBase: selectedItem.taxbase,
                    taxRate: 0.75,
                    basicTaxDue: selectedItem.taxdue,
                    surcharge: selectedItem.surcharge,
                    interest: selectedItem.interest,
                    totalAmountDue: selectedItem.totalamountdue,
                },
                preparedBy: currentUser?.name || "USER",
                preparedByDesignation: currentUser?.designation || "DESIGNATION",
        });
        setSelectedItem(null);
    }

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/transfertax`);
            if (!res.ok) throw new Error("Failed to fetch transfer taxes");
            const result = await res.json();
            setData(result);
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxes();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) return;
        
        try {
            const res = await fetch(`/api/transfertax/${id}`, {
                method: "DELETE"
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to delete");
            }
            toast.success("Transaction deleted successfully");
            setData(data.filter(item => item.id !== id));
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const filteredData = data.filter(item => 
       item.transferee.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.transferor.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (previewData) {
        return (
            <div className="absolute inset-0 z-50 bg-gray-50 overflow-auto rounded-tl-xl md:rounded-tl-none">
                <InvoicePreview data={previewData} onBack={() => setPreviewData(null)} />
            </div>
        )
    }

    return (
        <div className="p-4 relative">
            <div className="mb-4 flex gap-4">
                <div className="flex items-end space-x-2">
                    <Field>
                        <Label>Search by Name or ID</Label>
                        <Input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Enter Transferee or Transferor..."
                            className="w-64"
                        />
                    </Field>
                </div>
            </div>
            
            {loading && <p className="text-muted-foreground font-medium">Loading transactions...</p>}
            
            {!loading && filteredData.length === 0 && (
                <p className="text-muted-foreground font-medium">No transactions found.</p>
            )}

            {!loading && filteredData.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border px-4 py-2 text-left w-32">Date</th>
                                <th className="border px-4 py-2 text-left">Type</th>
                                <th className="border px-4 py-2 text-left min-w-[150px]">Transferee</th>
                                <th className="border px-4 py-2 text-left min-w-[150px]">Transferor</th>
                                <th className="border px-4 py-2 text-right">Market Value</th>
                                <th className="border px-4 py-2 text-right">Consideration</th>
                                <th className="border px-4 py-2 text-right">Tax Base</th>
                                <th className="border px-4 py-2 text-right">Tax Due</th>
                                <th className="border px-4 py-2 text-right">Surcharge</th>
                                <th className="border px-4 py-2 text-right">Interest</th>
                                <th className="border px-4 py-2 text-right">Amount Due</th>
                                <th className="border px-4 py-2 text-center">Validity Date</th>
                                <th className="border px-4 py-2 text-center">Status</th>
                                <th className="border px-4 py-2 text-left">Encoded By</th>
                                <th className="border px-4 py-2 text-center w-64">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item) => {
                                const isOwnerOrAdmin = currentUser.id === item.userId || currentUser.role === "ADMIN";
                                return (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    <td className="border px-4 py-2 whitespace-nowrap">
                                        {new Date(item.transactionDate).toLocaleDateString()}
                                    </td>
                                    <td className="border px-4 py-2">{item.transactionType}</td>
                                    <td className="border px-4 py-2">
                                        <button 
                                            onClick={() => setSelectedItem(item)}
                                            className="text-primary hover:underline font-bold focus:outline-none text-left"
                                        >
                                            {item.transferee}
                                        </button>
                                    </td>
                                    <td className="border px-4 py-2">{item.transferor}</td>
                                    <td className="border px-4 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                                        P {Number(item.totalmarketvalue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                                        P {Number(item.considerationvalue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                                        P {Number(item.taxbase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">
                                        P {Number(item.taxdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-right font-medium text-destructive whitespace-nowrap">
                                        P {Number(item.surcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-right font-medium text-destructive whitespace-nowrap">
                                        P {Number(item.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-right font-bold text-primary whitespace-nowrap">
                                        P {Number(item.totalamountdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="border px-4 py-2 text-center whitespace-nowrap">
                                        {item.validuntil || "N/A"}
                                    </td>
                                    <td className="border px-4 py-2 text-center">
                                        <span className={`px-2 py-1 inline-flex items-center rounded-full text-xs font-semibold ${item.paymentstatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {item.paymentstatus || "PENDING"}
                                        </span>
                                    </td>
                                    <td className="border px-4 py-2">{item.user?.name || "Unknown"}</td>
                                    <td className="border px-4 py-2 text-center space-x-2 whitespace-nowrap">
                                        {item.notarialDocument?.document_url && (
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={item.notarialDocument.document_url} target="_blank" rel="noreferrer">
                                                    View Doc
                                                </a>
                                            </Button>
                                        )}
                                        {isOwnerOrAdmin && (
                                            <>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/transfertax/${item.id}/edit`}>Edit</Link>
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Details Modal */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
                    <DialogHeader className="print:hidden">
                        <DialogTitle>Transfer Tax Computation Summary</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-6">
                            {/* Print Headers only visible during window.print */}
                            <div className="hidden print:block mb-8 border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <h1 className="text-2xl font-bold uppercase tracking-widest">Office of the City Treasurer</h1>
                                        <h2 className="text-xl font-semibold mt-1">TRANSFER TAX COMPUTATION SUMMARY</h2>
                                        <p className="text-sm mt-2">Date: {new Date(selectedItem.transactionDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <QRCode value={`ID: ${selectedItem.id}\nNew Owner: ${selectedItem.transferee}\nAmount Due: P ${Number(selectedItem.totalamountdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} size={80} level="M" />
                                        <span className="text-[10px] mt-1 text-muted-foreground break-all max-w-[80px] text-center">{selectedItem.id.slice(-8)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Owner</h3>
                                    <p className="mt-1 font-medium">{selectedItem.transferor || "-"}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">New Owner</h3>
                                    <p className="mt-1 font-medium">{selectedItem.transferee || "-"}</p>
                                </div>
                            </div>

                            {selectedItem.details && selectedItem.details.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Properties computation</h3>
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted text-muted-foreground">
                                                <th className="px-2 py-1 text-left font-medium">TD No</th>
                                                <th className="px-2 py-1 text-left font-medium">Lot No</th>
                                                <th className="px-2 py-1 text-right font-medium">Market Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItem.details.map((d: any) => (
                                                <tr key={d.id} className="border-b">
                                                    <td className="px-2 py-1">{d.taxdecnumber}</td>
                                                    <td className="px-2 py-1">{d.lotNumber || "-"}</td>
                                                    <td className="px-2 py-1 text-right">P {Number(d.marketValue || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="font-bold border-t-2">
                                                <td colSpan={2} className="px-2 py-2 text-right">Total Market Value:</td>
                                                <td className="px-2 py-2 text-right">P {Number(selectedItem.totalmarketvalue || 0).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 border-b pb-4 mt-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Document Info</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedItem.notarialDocument?.document_url ? "1" : "0"} file(s) attached</p>
                                    {selectedItem.notarialDocument?.document_url && (
                                        <a href={selectedItem.notarialDocument.document_url} target="_blank" className="text-primary hover:underline font-bold text-sm" rel="noreferrer">
                                            View Attached PDF
                                        </a>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction Info</h3>
                                    <p className="mt-1 font-medium">{selectedItem.transactionType || "Not specified"}</p>
                                    <p className="text-sm text-muted-foreground">Computation Valid Until: {selectedItem.validuntil || "N/A"}</p>
                                </div>
                            </div>

                            <div className="mt-4 border-b pb-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transfer Tax Computation</h3>
                                <div className="space-y-1 text-sm bg-muted/20 p-4 rounded-md border h-fit">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Market Value:</span>
                                        <span>P {Number(selectedItem.totalmarketvalue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {selectedItem.transactionType === "Deed of Sale" && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Consideration:</span>
                                            <span>P {Number(selectedItem.considerationvalue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-medium">
                                        <span>Tax Base:</span>
                                        <span>P {Number(selectedItem.taxbase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax Rate:</span>
                                        <span>0.75%</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t mt-1">
                                        <span>Basic Tax Due:</span>
                                        <span>P {Number(selectedItem.taxdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {Number(selectedItem.surcharge || 0) > 0 && (
                                        <div className="pt-2">
                                            <div className="flex justify-between text-destructive">
                                                <span>Surcharge (25%):</span>
                                                <span>P {Number(selectedItem.surcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-destructive">
                                                <span>Interest (2% / month):</span>
                                                <span>P {Number(selectedItem.interest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold pt-3 border-t text-primary mt-2">
                                        <span>Total Amount Due:</span>
                                        <span>P {Number(selectedItem.totalamountdue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Print-only Signatures */}
                            <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 break-inside-avoid">
                                <div>
                                    <p className="text-xs mb-8">Prepared by:</p>
                                    <p className="font-bold border-b border-black w-[80%] pb-1 uppercase">{currentUser?.name || "USER"}</p>
                                    <p className="text-xs mt-1">{currentUser?.designation || "Designation"}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-8">Approved by:</p>
                                    <p className="font-bold border-b border-black w-[80%] pb-1 uppercase"></p>
                                    <p className="text-xs mt-1">City Treasurer / Authorized Personnel</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 print:hidden">
                                <Button onClick={handlePreview} className="bg-blue-600 hover:bg-blue-700">🖨️ Print Summary</Button>
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
