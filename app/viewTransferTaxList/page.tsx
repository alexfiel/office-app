"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllTransferTaxes, deleteTransferTax } from "@/lib/actions/transfertax-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Calculator, FileText, Clock, CheckCircle } from "lucide-react";
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

export default function ViewTransferTaxList() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [taxes, setTaxes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const loadTaxes = async () => {
        setIsLoading(true);
        try {
            const res = await getAllTransferTaxes();
            if (res.error) {
                toast.error(res.error);
            } else {
                setTaxes(res.taxes || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load transfer taxes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTaxes();
    }, []);

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const res = await deleteTransferTax(deleteId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Transaction deleted successfully. Real property owners have been reverted.");
                loadTaxes();
            }
        } catch (error) {
            toast.error("Failed to delete transaction.");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const user = {
        id: "1",
        name: "User",
        email: "",
        avatar: "",
        role: "ADMIN"
    };

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
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 uppercase font-semibold text-xs border-b">
                                        <tr>
                                            <th className="px-6 py-4">Control No.</th>
                                            <th className="px-6 py-4">Notarial Doc</th>
                                            <th className="px-6 py-4">Transferee</th>
                                            <th className="px-6 py-4">Date Computed</th>
                                            <th className="px-6 py-4 text-right">Amount Due</th>
                                            <th className="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-12">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                        <span className="text-gray-500 font-medium">Loading records...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : taxes.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-12 text-gray-500">
                                                    No transfer tax computations found.
                                                </td>
                                            </tr>
                                        ) : (
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            taxes.map((tax: any) => (
                                                <tr key={tax.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-medium text-gray-900">
                                                        {tax.t_controlNumber}
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
                                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                                        ₱{Number(tax.t_TotalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                                onClick={() => toast.info("Edit workflow not yet implemented. Delete and recreate for now.")}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                onClick={() => setDeleteId(tax.id)}
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
                        </CardContent>
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
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
