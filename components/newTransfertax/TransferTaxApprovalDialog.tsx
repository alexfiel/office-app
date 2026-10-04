"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    FileText,
    Clock,
    UserCheck,
    Calendar,
    AlertTriangle,
    Paperclip,
    ExternalLink,
    Loader2,
    Receipt
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { approveTransferTaxTransaction, rejectTransferTaxTransaction } from "@/lib/actions/transfertax-actions";

interface TransferTaxApprovalDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    tax: any;
    currentUser?: {
        id?: string | null;
        name?: string | null;
        role?: string | null;
        designation?: string | null;
    } | null;
    onApprovalSuccess?: () => void;
}

export function TransferTaxApprovalDialog({
    isOpen,
    onOpenChange,
    tax,
    currentUser,
    onApprovalSuccess
}: TransferTaxApprovalDialogProps) {
    const [remarks, setRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

    if (!tax) return null;

    const isApprover = currentUser?.role === "APPROVER" || currentUser?.role === "ADMIN";
    const statusNormalized = (tax.t_status || "").toLowerCase();
    const isPending = statusNormalized === "pending approval" || statusNormalized === "pending";
    const isApproved = statusNormalized === "approved";
    const isPaid = statusNormalized === "paid";
    const isVoided = statusNormalized === "voided";

    const validityDate = tax.t_validity ? new Date(tax.t_validity) : null;
    const isExpired = validityDate ? new Date() > validityDate && validityDate.getFullYear() < 2099 : false;

    const handleApprove = async () => {
        if (!isApprover) {
            toast.error("You do not have the required APPROVER role to approve this assessment.");
            return;
        }

        setIsSubmitting(true);
        setActionType("approve");
        try {
            const res = await approveTransferTaxTransaction(tax.id, remarks);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.message || "Transfer tax computation approved successfully!");
                onOpenChange(false);
                setRemarks("");
                if (onApprovalSuccess) {
                    onApprovalSuccess();
                }
            }
        } catch (error) {
            console.error("Approval error:", error);
            toast.error("Failed to approve transaction.");
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    const handleReject = async () => {
        if (!isApprover) {
            toast.error("You do not have the required APPROVER role to return this assessment.");
            return;
        }

        if (!remarks.trim()) {
            toast.error("Please provide a reason or remarks for returning this transaction.");
            return;
        }

        setIsSubmitting(true);
        setActionType("reject");
        try {
            const res = await rejectTransferTaxTransaction(tax.id, remarks);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.message || "Transaction returned for revision.");
                onOpenChange(false);
                setRemarks("");
                if (onApprovalSuccess) {
                    onApprovalSuccess();
                }
            }
        } catch (error) {
            console.error("Rejection error:", error);
            toast.error("Failed to return transaction.");
        } finally {
            setIsSubmitting(false);
            setActionType(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 border-b border-slate-800">
                    <DialogHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30 backdrop-blur-sm">
                                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                        Assessment Review & Approval
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-blue-200/80 mt-0.5">
                                        City of Tagbilaran • Office of the City Treasurer
                                    </DialogDescription>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isPending && (
                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-xs font-semibold px-3 py-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                                        Pending Approval
                                    </Badge>
                                )}
                                {isApproved && (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-xs font-semibold px-3 py-1 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Approved
                                    </Badge>
                                )}
                                {isPaid && (
                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/40 text-xs font-semibold px-3 py-1 flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5" />
                                        Paid
                                    </Badge>
                                )}
                                {isVoided && (
                                    <Badge className="bg-red-500/20 text-red-300 border-red-400/40 text-xs font-semibold px-3 py-1 flex items-center gap-1.5">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Voided
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Quick Metadata Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-800/80 text-xs">
                        <div>
                            <span className="text-slate-400 block font-medium">Control Number</span>
                            <span className="font-mono font-bold text-white text-sm">{tax.t_controlNumber}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Date Computed</span>
                            <span className="text-slate-200">
                                {tax.t_DateCompute ? format(new Date(tax.t_DateCompute), "MMM d, yyyy") : "N/A"}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Validity Date</span>
                            <span className={`font-medium ${isExpired ? 'text-red-300 font-bold' : 'text-slate-200'}`}>
                                {validityDate && validityDate.getFullYear() >= 2099
                                    ? "Max Interest Reached"
                                    : validityDate
                                    ? format(validityDate, "MMM d, yyyy")
                                    : "N/A"}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Assessed By</span>
                            <span className="text-slate-200 truncate block">
                                {tax.user?.name || "Assessor Staff"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-6">
                    {/* Expiration warning if applicable */}
                    {isExpired && (
                        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold block">Validity Period Has Expired</span>
                                The computation validity period for this transaction has lapsed. Surcharge and monthly interest penalties should be recomputed before final approval.
                            </div>
                        </div>
                    )}

                    {/* Existing Approval Stamp if already approved */}
                    {isApproved && (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                                        Approved Assessment
                                        <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">Verified</Badge>
                                    </h4>
                                    <p className="text-xs text-emerald-800 mt-1">
                                        Approved by <span className="font-semibold text-emerald-950">{tax.t_approvedBy || "Authorized Approver"}</span> on{" "}
                                        {tax.t_approvedDate ? format(new Date(tax.t_approvedDate), "MMM d, yyyy • h:mm a") : "Official Record"}.
                                    </p>
                                    {tax.t_approvalRemarks && (
                                        <p className="text-xs text-emerald-900/80 italic mt-1.5 bg-emerald-100/60 p-2 rounded border border-emerald-200">
                                            "{tax.t_approvalRemarks}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase bg-white px-2.5 py-1 rounded shadow-xs border border-emerald-200">
                                Ready for Payment
                            </span>
                        </div>
                    )}

                    {/* Notarial Document Information */}
                    <div className="bg-slate-50 border rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                Notarial Document Verification
                            </h4>
                            {tax.notarialDocument?.document_url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={() => window.open(tax.notarialDocument.document_url, '_blank')}
                                >
                                    <Paperclip className="w-3.5 h-3.5 mr-1" />
                                    View Attached Deed
                                    <ExternalLink className="w-3 h-3 ml-1 text-blue-400" />
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div>
                                <span className="text-slate-500 block">Document Name</span>
                                <span className="font-semibold text-slate-900">{tax.notarialDocument?.documentName || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Document Type</span>
                                <span className="font-medium text-slate-800">{tax.notarialDocument?.documentType || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Doc / Book / Page / Series</span>
                                <span className="font-medium text-slate-800">{tax.notarialDocument?.documentNumber || "N/A"}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Notarized By</span>
                                <span className="font-medium text-slate-800">{tax.notarialDocument?.notarizedBy || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Property & Tax Computation Table */}
                    <div className="border rounded-xl overflow-hidden">
                        <div className="bg-slate-100/80 px-4 py-2.5 border-b flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Properties & Tax Breakdown
                            </h4>
                            <span className="text-xs text-slate-500 font-medium">
                                {tax.t_transfertaxdetails?.length || 0} Parcel(s) Assessed
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-600 border-b">
                                    <tr>
                                        <th className="px-3 py-2.5">Tax Dec No.</th>
                                        <th className="px-3 py-2.5">Lot No.</th>
                                        <th className="px-3 py-2.5">Transferee / Transferor</th>
                                        <th className="px-3 py-2.5 text-right">Area (sqm)</th>
                                        <th className="px-3 py-2.5 text-right">Market Value</th>
                                        <th className="px-3 py-2.5 text-right">Consideration</th>
                                        <th className="px-3 py-2.5 text-right">Tax Base</th>
                                        <th className="px-3 py-2.5 text-right">Total Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tax.t_transfertaxdetails?.map((dt: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-3 py-2.5 font-medium text-slate-900">
                                                {dt.realProperty?.taxdecnumber || dt.nt_taxdecnumber}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-600">
                                                {dt.realProperty?.lotNumber || dt.nt_lotnumber || "—"}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="font-semibold text-slate-900">{dt.nt_transferee || "N/A"}</div>
                                                <div className="text-[10px] text-slate-500">From: {dt.nt_transferror || "N/A"}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                                                {Number(dt.nt_area || dt.realProperty?.area || 0).toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                ₱{Number(dt.nt_marketvalue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                                                ₱{Number(dt.nt_considerationvalue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-900">
                                                ₱{Number(dt.nt_taxbase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                                                ₱{Number(dt.nt_totalTransferTaxDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary Calculation Card */}
                    <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-xl p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-slate-500 block">Total Market Value</span>
                                <span className="font-mono font-semibold text-slate-800 text-sm">
                                    ₱{Number(tax.t_TotalMarketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Total Consideration</span>
                                <span className="font-mono font-semibold text-slate-800 text-sm">
                                    ₱{Number(tax.t_TotalConsiderationValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Assessed Tax Base</span>
                                <span className="font-mono font-bold text-blue-900 text-sm">
                                    ₱{Number(tax.t_TaxBase || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="border-l pl-4 border-blue-200">
                                <span className="text-slate-500 block">Basic Tax Due</span>
                                <span className="font-mono font-semibold text-slate-800 text-sm">
                                    ₱{(Number(tax.t_TotalAmountDue || 0) - Number(tax.t_TotalSurcharge || 0) - Number(tax.t_TotalInterest || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mt-3 pt-3 border-t border-blue-100">
                            <div>
                                <span className="text-slate-500 block">Surcharge (25%)</span>
                                <span className="font-mono font-semibold text-amber-700 text-sm">
                                    ₱{Number(tax.t_TotalSurcharge || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Interest ({tax.t_daysElapsed || 0} days elapsed)</span>
                                <span className="font-mono font-semibold text-amber-700 text-sm">
                                    ₱{Number(tax.t_TotalInterest || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-blue-200 shadow-xs flex justify-between items-center">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Grand Total Due</span>
                                    <span className="font-black text-emerald-600 text-lg font-mono">
                                        ₱{Number(tax.t_TotalAmountDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role & Approval Action Controls */}
                    {isApprover ? (
                        <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-blue-600" />
                                    Approver Review & Action
                                </span>
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                                    Signed in as {currentUser?.name || "Approver"} ({currentUser?.role || "APPROVER"})
                                </Badge>
                            </div>

                            <Textarea
                                placeholder="Add optional approval remarks or reason for return (e.g. 'Computation verified against Deed of Absolute Sale')..."
                                value={remarks}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                                className="text-xs bg-white resize-none"
                                rows={2}
                                disabled={isSubmitting}
                            />
                        </div>
                    ) : (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600">
                            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                            <div>
                                <span className="font-semibold text-slate-800">Read-Only Mode</span>
                                <p className="text-slate-500">
                                    You are currently viewing this computation in read-only audit mode. To approve or reject assessments, an account with the <span className="font-semibold text-slate-700">APPROVER</span> role is required.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 bg-slate-50 border-t flex items-center justify-between gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Close
                    </Button>

                    {isApprover && isPending && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={handleReject}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && actionType === "reject" ? (
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                ) : (
                                    <XCircle className="w-4 h-4 mr-1.5" />
                                )}
                                Return for Revision
                            </Button>

                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
                                onClick={handleApprove}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && actionType === "approve" ? (
                                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                )}
                                Approve Computation
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
