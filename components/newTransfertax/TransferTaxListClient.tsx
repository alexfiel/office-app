"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteTransferTax, recomputeTransferTax, getPaginatedTransferTaxes, updateNotarialDocumentAttachment } from "@/lib/actions/transfertax-actions";
import { uploadFile } from "@/lib/upload/upload-action";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Calculator, FileText, Clock, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Search, LayoutGrid, List, Paperclip, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TransferTaxEditDialog } from "./TransferTaxEditDialog";
import { TransferTaxPaymentDialog } from "./TransferTaxPaymentDialog";

export function TransferTaxListClient({ user }: { user: any }) {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [taxes, setTaxes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [recomputingId, setRecomputingId] = useState<string | null>(null);
    const [isRecomputingId, setIsRecomputingId] = useState<string | null>(null);
    const [editingTax, setEditingTax] = useState<any | null>(null);
    const [paymentTax, setPaymentTax] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "cards">("list");
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [totalItems, setTotalItems] = useState(0);

    // Upload state
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, notarialId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            toast.error("Please upload a valid PDF document.");
            return;
        }

        setUploadingDocId(notarialId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            
            const uploadResult = await uploadFile(formData);
            if (uploadResult?.url) {
                const res = await updateNotarialDocumentAttachment(notarialId, uploadResult.url);
                if (res.success) {
                    toast.success("Attachment successfully uploaded and linked!");
                    loadTaxes(); // refresh the list
                } else {
                    toast.error("Failed to link attachment to document.");
                }
            } else {
                toast.error("Upload failed: No URL returned.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during upload.");
        } finally {
            setUploadingDocId(null);
            e.target.value = ""; // reset input
        }
    };

    const loadTaxes = async () => {
        setIsLoading(true);
        try {
            const res = await getPaginatedTransferTaxes(currentPage, ITEMS_PER_PAGE, searchQuery);
            if (res.error) {
                toast.error(res.error);
            } else {
                setTaxes(res.taxes || []);
                setTotalPages(res.totalPages || 1);
                setTotalItems(res.total || 0);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load transfer taxes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage !== 1) {
                setCurrentPage(1); // Setting currentPage triggers the other useEffect to loadTaxes
            } else {
                loadTaxes();
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    useEffect(() => {
        loadTaxes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handleViewComputation = async (tax: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const validityDate = new Date(tax.t_validity);
        
        if (tax.t_status?.toLowerCase() !== "paid" && today > validityDate) {
            setIsRecomputingId(tax.id);
            try {
                const res = await recomputeTransferTax(tax.id);
                if (res.error) {
                    toast.error(res.error);
                } else {
                    toast.success("Computation automatically updated based on current date.");
                }
            } catch (error) {
                console.error("Error recomputing", error);
            } finally {
                setIsRecomputingId(null);
            }
        }
        
        router.push(`/newTransferTax/summary/${tax.t_NotarialId}`);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteTransferTax(deleteId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Transaction deleted successfully. Real property owners have been reverted.");
                // Reload everything
                setCurrentPage(1);
                loadTaxes();
            }
        } catch (error) {
            toast.error("Failed to delete transaction.");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleRecompute = async (id: string) => {
        setRecomputingId(id);
        try {
            const res = await recomputeTransferTax(id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Transaction recomputed successfully! Penalties and dates updated.");
                loadTaxes();
            }
        } catch (error) {
            toast.error("Failed to recompute transaction.");
        } finally {
            setRecomputingId(null);
        }
    };

    // Removed hardcoded user

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" user={user} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-6 lg:p-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Transfer Tax Transactions</h1>
                            <p className="text-muted-foreground mt-2">Manage and audit all computed transfer tax transactions.</p>
                        </div>
                        <Button onClick={() => router.push("/newTransferTax")} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                            New Computation
                        </Button>
                    </div>

                    <Card className="border shadow-sm rounded-xl overflow-hidden flex-1">
                        <div className="p-4 border-b bg-white flex items-center justify-between">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="text"
                                    placeholder="Search by transferee, transferor, control no, amount due..."
                                    className="pl-9 bg-gray-50/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-md ml-4 shrink-0">
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    className={`h-8 px-3 ${viewMode === "list" ? "bg-white shadow-sm text-gray-900 hover:bg-white" : "text-gray-500 hover:text-gray-900"}`}
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="w-4 h-4 mr-2" />
                                    View by List
                                </Button>
                                <Button
                                    variant={viewMode === "cards" ? "default" : "ghost"}
                                    size="sm"
                                    className={`h-8 px-3 ${viewMode === "cards" ? "bg-white shadow-sm text-gray-900 hover:bg-white" : "text-gray-500 hover:text-gray-900"}`}
                                    onClick={() => setViewMode("cards")}
                                >
                                    <LayoutGrid className="w-4 h-4 mr-2" />
                                    View by Cards
                                </Button>
                            </div>
                        </div>
                        <CardContent className={viewMode === "list" ? "p-0" : "p-6 bg-gray-50/50"}>
                            {viewMode === "list" ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-xs border-b">
                                            <tr>
                                                <th className="px-6 py-4">Control No.</th>
                                                <th className="px-6 py-4">Notarial Doc</th>
                                                <th className="px-6 py-4">Transferee</th>
                                                <th className="px-6 py-4">Date Computed</th>
                                                <th className="px-6 py-4">Validity Date</th>
                                                <th className="px-6 py-4 text-center">Status</th>
                                                <th className="px-6 py-4 text-right">Amount Due</th>
                                                <th className="px-6 py-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-12">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                            <span className="text-gray-500 font-medium">Loading records...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : taxes.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} className="text-center py-12 text-gray-500">
                                                        No transfer tax computations found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                taxes.map((tax: any) => (
                                                    <tr key={tax.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" onClick={() => handleViewComputation(tax)}>
                                                            <div className="flex items-center gap-2">
                                                                {isRecomputingId === tax.id && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
                                                                <span>{tax.t_controlNumber}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-gray-900">{tax.notarialDocument?.documentName}</span>
                                                                <span className="text-xs text-gray-500 flex items-center mt-1">
                                                                    <FileText className="w-3 h-3 mr-1" />
                                                                    {tax.notarialDocument?.documentNumber}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-800">
                                                            {tax.t_transfertaxdetails[0]?.nt_transferee || "Multiple"}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            <div className="flex items-center">
                                                                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                                                {format(new Date(tax.t_DateCompute), "MMM d, yyyy")}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            <div className="flex items-center">
                                                                <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                                                                {new Date(tax.t_validity).getFullYear() >= 2099 ? "Max Interest Reached" : format(new Date(tax.t_validity), "MMM d, yyyy")}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {tax.t_status?.toLowerCase() === "paid" ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                    Paid
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                    Unpaid
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                            ₱{Number(tax.t_TotalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <input 
                                                                    type="file" 
                                                                    accept=".pdf" 
                                                                    className="hidden" 
                                                                    id={`file-upload-list-${tax.t_NotarialId}`}
                                                                    onChange={(e) => handleFileUpload(e, tax.t_NotarialId)}
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-gray-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
                                                                    disabled={uploadingDocId === tax.t_NotarialId}
                                                                    onClick={() => {
                                                                        if (tax.notarialDocument?.document_url) {
                                                                            window.open(tax.notarialDocument.document_url, '_blank');
                                                                        } else {
                                                                            document.getElementById(`file-upload-list-${tax.t_NotarialId}`)?.click();
                                                                        }
                                                                    }}
                                                                    title={tax.notarialDocument?.document_url ? "View Attachment" : "Upload Attachment"}
                                                                >
                                                                    {uploadingDocId === tax.t_NotarialId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                                                    onClick={() => handleRecompute(tax.id)}
                                                                    disabled={recomputingId === tax.id || tax.t_status?.toLowerCase() === "paid"}
                                                                    title="Recompute Penalties"
                                                                >
                                                                    <RefreshCw className={`w-4 h-4 ${recomputingId === tax.id ? 'animate-spin' : ''}`} />
                                                                </Button>
                                                                {tax.t_status === "pending" && (
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                                                        onClick={() => setPaymentTax(tax)}
                                                                        title="Capture Payment"
                                                                    >
                                                                        <Receipt className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                                    onClick={() => setEditingTax(tax)}
                                                                    disabled={tax.t_status?.toLowerCase() === "paid"}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                    onClick={() => setDeleteId(tax.id)}
                                                                    disabled={tax.t_status?.toLowerCase() === "paid"}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {isLoading ? (
                                        <div className="col-span-full flex justify-center py-12">
                                            <div className="flex items-center justify-center space-x-2">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <span className="text-gray-500 font-medium">Loading records...</span>
                                            </div>
                                        </div>
                                    ) : taxes.length === 0 ? (
                                        <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
                                            No transfer tax computations found.
                                        </div>
                                    ) : (
                                        taxes.map((tax: any) => (
                                            <div key={tax.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                                                <div className="h-32 bg-gradient-to-b from-blue-50 to-white border-b relative p-4 flex flex-col items-center justify-center cursor-pointer overflow-hidden" onClick={() => handleViewComputation(tax)}>
                                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm border border-blue-100 flex items-center justify-center z-10 mb-2 group-hover:scale-110 transition-transform">
                                                        <FileText className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="text-[10px] font-bold text-blue-800 tracking-wider z-10 uppercase">
                                                        City of Tagbilaran
                                                    </div>
                                                    <div className="text-[9px] text-gray-500 z-10 uppercase mt-0.5 font-medium">
                                                        Transfer Tax Computation
                                                    </div>
                                                    <div className="absolute top-2 right-2 text-[8px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded shadow-sm font-bold">
                                                        {tax.t_controlNumber}
                                                    </div>
                                                    <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm ${tax.t_status?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {tax.t_status?.toLowerCase() === 'paid' ? 'PAID' : 'UNPAID'}
                                                    </div>
                                                </div>

                                                <div className="p-4 flex-1 flex flex-col">
                                                    <div className="mb-4 flex-1">
                                                        <h3 className="font-bold text-gray-900 line-clamp-2 text-sm leading-tight mb-1" title={tax.t_transfertaxdetails[0]?.nt_transferee || "Multiple"}>
                                                            {tax.t_transfertaxdetails[0]?.nt_transferee || "Multiple"}
                                                        </h3>
                                                        <div className="flex items-center text-xs text-gray-500 mb-1">
                                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                            Computed: {format(new Date(tax.t_DateCompute), "MMM d, yyyy")}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500 mb-2">
                                                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                            Valid Until: {new Date(tax.t_validity).getFullYear() >= 2099 ? "Max Interest Reached" : format(new Date(tax.t_validity), "MMM d, yyyy")}
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t flex justify-between items-end">
                                                            <span className="text-xs text-gray-500 font-medium">Total Amount Due</span>
                                                            <span className="font-black text-emerald-600 text-base">
                                                                ₱{Number(tax.t_TotalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-3 border-t">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="flex-1 h-8 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                                                            onClick={() => handleViewComputation(tax)}
                                                            disabled={isRecomputingId === tax.id}
                                                        >
                                                            {isRecomputingId === tax.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1" />}
                                                            View Details
                                                        </Button>
                                                        <input 
                                                            type="file" 
                                                            accept=".pdf" 
                                                            className="hidden" 
                                                            id={`file-upload-cards-${tax.t_NotarialId}`}
                                                            onChange={(e) => handleFileUpload(e, tax.t_NotarialId)}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-gray-600 hover:text-blue-700 hover:bg-blue-50 border-gray-200"
                                                            disabled={uploadingDocId === tax.t_NotarialId}
                                                            onClick={() => {
                                                                if (tax.notarialDocument?.document_url) {
                                                                    window.open(tax.notarialDocument.document_url, '_blank');
                                                                } else {
                                                                    document.getElementById(`file-upload-cards-${tax.t_NotarialId}`)?.click();
                                                                }
                                                            }}
                                                            title={tax.notarialDocument?.document_url ? "View Attachment" : "Upload Attachment"}
                                                        >
                                                            {uploadingDocId === tax.t_NotarialId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                                            onClick={() => handleRecompute(tax.id)}
                                                            disabled={recomputingId === tax.id || tax.t_status?.toLowerCase() === "paid"}
                                                            title="Recompute Penalties"
                                                        >
                                                            <RefreshCw className={`w-4 h-4 ${recomputingId === tax.id ? 'animate-spin' : ''}`} />
                                                        </Button>
                                                        {tax.t_status === "pending" && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                                                                onClick={() => setPaymentTax(tax)}
                                                                title="Capture Payment"
                                                            >
                                                                <Receipt className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 px-2 text-blue-600 hover:bg-blue-50 border-blue-200"
                                                            onClick={() => setEditingTax(tax)}
                                                            disabled={tax.t_status?.toLowerCase() === "paid"}
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 px-2 text-red-600 hover:bg-red-50 border-red-200"
                                                            onClick={() => setDeleteId(tax.id)}
                                                            disabled={tax.t_status?.toLowerCase() === "paid"}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                            <div className="text-sm text-gray-500">
                                <span>
                                    Showing {taxes.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to{" "}
                                    {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                                    {totalItems} entries
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isLoading}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="text-sm font-medium mx-2">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isLoading}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>

                    <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" />
                                    Confirm Deletion
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this Transfer Tax Computation? 
                                    <br /><br />
                                    <strong>Warning:</strong> Deleting this will also revert the owner names of the associated real properties back to their previous state (removing the transferee and restoring the transferors). This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete();
                                    }} 
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? "Deleting..." : "Yes, Delete & Revert Owner"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <TransferTaxEditDialog 
                        open={!!editingTax} 
                        onOpenChange={(open) => !open && setEditingTax(null)}
                        taxData={editingTax}
                        isAdmin={user.role === "ADMIN"}
                        onSuccess={() => {
                            setEditingTax(null);
                            loadTaxes();
                        }}
                        onFullRevert={() => {
                            if (editingTax) {
                                setDeleteId(editingTax.id);
                            }
                        }}
                    />

                    <TransferTaxPaymentDialog
                        isOpen={!!paymentTax}
                        onOpenChange={(open) => !open && setPaymentTax(null)}
                        tax={paymentTax}
                        onSuccess={() => {
                            setPaymentTax(null);
                            loadTaxes();
                        }}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
