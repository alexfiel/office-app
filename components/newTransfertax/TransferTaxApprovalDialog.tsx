"use client";

import { useState, useRef, useEffect } from "react";
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
    AlertTriangle,
    Paperclip,
    ExternalLink,
    Loader2,
    Receipt,
    Maximize2,
    Minimize2,
    Columns,
    Eye,
    EyeOff,
    RotateCcw,
    X,
    GripHorizontal,
    Building2,
    Landmark,
    Calculator,
    CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { approveTransferTaxTransaction, rejectTransferTaxTransaction } from "@/lib/actions/transfertax-actions";

type SizePreset = "standard" | "wide" | "fullscreen";

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
    const [sizePreset, setSizePreset] = useState<SizePreset>("wide");
    const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showDeedPreview, setShowDeedPreview] = useState(false);

    const [remarks, setRemarks] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

    // Reset preview or custom size if needed when dialog opens
    useEffect(() => {
        if (!isOpen) {
            setIsDragging(false);
        }
    }, [isOpen]);

    if (!tax) return null;

    const isApprover = currentUser?.role === "APPROVER" || currentUser?.role === "ADMIN";
    const statusNormalized = (tax.t_status || "").toLowerCase();
    const isPending = statusNormalized === "pending approval" || statusNormalized === "pending";
    const isApproved = statusNormalized === "approved";
    const isPaid = statusNormalized === "paid";
    const isVoided = statusNormalized === "voided";

    const validityDate = tax.t_validity ? new Date(tax.t_validity) : null;
    const isExpired = validityDate ? new Date() > validityDate && validityDate.getFullYear() < 2099 : false;

    const details = tax.t_transfertaxdetails || [];
    const totalArea = details.reduce((sum: number, dt: any) => sum + Number(dt.nt_area || dt.realProperty?.area || 0), 0);
    const totalMarketValue = Number(tax.t_TotalMarketValue || details.reduce((sum: number, dt: any) => sum + Number(dt.nt_marketvalue || 0), 0));
    const totalConsideration = Number(tax.t_TotalConsiderationValue || details.reduce((sum: number, dt: any) => sum + Number(dt.nt_considerationvalue || 0), 0));
    const totalTaxBase = Number(tax.t_TaxBase || Math.max(totalMarketValue, totalConsideration));
    const totalSurcharge = Number(tax.t_TotalSurcharge || details.reduce((sum: number, dt: any) => sum + Number(dt.nt_surcharge || 0), 0));
    const totalInterest = Number(tax.t_TotalInterest || details.reduce((sum: number, dt: any) => sum + Number(dt.nt_interest || 0), 0));
    const totalAmountDue = Number(tax.t_TotalAmountDue || details.reduce((sum: number, dt: any) => sum + Number(dt.nt_totalTransferTaxDue || 0), 0));
    const basicTaxDue = Math.max(0, totalAmountDue - totalSurcharge - totalInterest);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);

        const onMouseMove = (moveEvent: MouseEvent) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const newWidth = Math.max(760, Math.min(window.innerWidth * 0.98, Math.abs(moveEvent.clientX - centerX) * 2));
            const newHeight = Math.max(520, Math.min(window.innerHeight * 0.96, Math.abs(moveEvent.clientY - centerY) * 2));
            setCustomSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
        };

        const onMouseUp = () => {
            setIsDragging(false);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const toggleMaximize = () => {
        if (sizePreset === "fullscreen" && !customSize) {
            setSizePreset("wide");
        } else {
            setCustomSize(null);
            setSizePreset("fullscreen");
        }
    };

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

    const getDialogStyle = (): React.CSSProperties => {
        if (customSize) {
            return {
                width: `${customSize.width}px`,
                height: `${customSize.height}px`,
                maxWidth: "98vw",
                maxHeight: "96vh"
            };
        }
        if (sizePreset === "fullscreen") {
            return {
                width: "98vw",
                height: "96vh",
                maxWidth: "98vw",
                maxHeight: "96vh"
            };
        }
        if (sizePreset === "wide") {
            return {
                width: "min(1480px, 97vw)",
                height: "min(920px, 94vh)",
                maxWidth: "98vw",
                maxHeight: "96vh"
            };
        }
        return {
            width: "min(1120px, 95vw)",
            height: "min(860px, 92vh)",
            maxWidth: "98vw",
            maxHeight: "96vh"
        };
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent 
                showCloseButton={false}
                style={getDialogStyle()}
                className={`p-0 border shadow-2xl flex flex-col overflow-hidden max-w-none sm:max-w-none ${isDragging ? 'duration-0 select-none' : 'duration-200'}`}
            >
                {/* Header with Title, Status, and Resizing Controls */}
                <div 
                    onDoubleClick={toggleMaximize}
                    className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 border-b border-slate-800 shrink-0 select-none cursor-default"
                >
                    <DialogHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* Left Brand & Title */}
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30 backdrop-blur-sm">
                                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                            Assessment Review & Approval
                                        </DialogTitle>
                                        
                                        {/* Status Badge */}
                                        {isPending && (
                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 animate-pulse" />
                                                Pending Approval
                                            </Badge>
                                        )}
                                        {isApproved && (
                                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Approved
                                            </Badge>
                                        )}
                                        {isPaid && (
                                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/40 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5">
                                                <Receipt className="w-3.5 h-3.5" />
                                                Paid
                                            </Badge>
                                        )}
                                        {isVoided && (
                                            <Badge className="bg-red-500/20 text-red-300 border-red-400/40 text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5">
                                                <XCircle className="w-3.5 h-3.5" />
                                                Voided
                                            </Badge>
                                        )}
                                    </div>
                                    <DialogDescription className="text-xs text-blue-200/80 mt-0.5">
                                        City of Tagbilaran • Office of the City Treasurer • Real Property Transfer Tax
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* Right Controls: Size Presets, Side-by-Side Deed, Maximize & Close */}
                            <div className="flex items-center gap-2">
                                {tax.notarialDocument?.document_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const nextState = !showDeedPreview;
                                            setShowDeedPreview(nextState);
                                            if (nextState && sizePreset === "standard") {
                                                setSizePreset("wide");
                                            }
                                        }}
                                        className={`h-8 text-xs font-medium border border-blue-400/30 ${
                                            showDeedPreview
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'bg-white/10 text-blue-200 hover:bg-white/20'
                                        }`}
                                        title={showDeedPreview ? "Hide Side-by-Side Deed Document" : "Split View: Inspect Attached Deed PDF"}
                                    >
                                        <Columns className="w-3.5 h-3.5 mr-1.5" />
                                        {showDeedPreview ? "Hide Deed Preview" : "Deed Preview"}
                                    </Button>
                                )}

                                {/* Size Preset Buttons */}
                                <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15 text-xs text-blue-200">
                                    <button
                                        type="button"
                                        onClick={() => { setCustomSize(null); setSizePreset("standard"); }}
                                        className={`px-2.5 py-1 rounded-md transition-colors ${sizePreset === "standard" && !customSize ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-white'}`}
                                        title="Standard Width (1120px)"
                                    >
                                        Standard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setCustomSize(null); setSizePreset("wide"); }}
                                        className={`px-2.5 py-1 rounded-md transition-colors ${sizePreset === "wide" && !customSize ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-white'}`}
                                        title="Wide View (1480px) - Great for detailed property inspection"
                                    >
                                        Wide
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setCustomSize(null); setSizePreset("fullscreen"); }}
                                        className={`px-2.5 py-1 rounded-md transition-colors ${sizePreset === "fullscreen" && !customSize ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-white'}`}
                                        title="Full Screen (98vw)"
                                    >
                                        Full Screen
                                    </button>
                                </div>

                                {customSize && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => { setCustomSize(null); setSizePreset("wide"); }}
                                        className="h-8 px-2 text-xs text-blue-300 hover:text-white hover:bg-white/10"
                                        title="Reset to default wide size"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                                        Reset Size
                                    </Button>
                                )}

                                {/* Maximize / Restore Toggle */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleMaximize}
                                    className="h-8 w-8 p-0 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg"
                                    title={sizePreset === "fullscreen" && !customSize ? "Restore Window Size" : "Maximize to Full Screen"}
                                >
                                    {sizePreset === "fullscreen" && !customSize ? (
                                        <Minimize2 className="w-4 h-4" />
                                    ) : (
                                        <Maximize2 className="w-4 h-4" />
                                    )}
                                </Button>

                                {/* Close Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenChange(false)}
                                    className="h-8 w-8 p-0 text-blue-200 hover:text-white hover:bg-red-500/80 rounded-lg"
                                    title="Close Window (Esc)"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Metadata Header Sub-Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
                        <div>
                            <span className="text-slate-400 block font-medium">Control Number</span>
                            <span className="font-mono font-bold text-white text-sm tracking-wide">{tax.t_controlNumber}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Date Computed</span>
                            <span className="text-slate-200">
                                {tax.t_DateCompute ? format(new Date(tax.t_DateCompute), "MMM d, yyyy") : "N/A"}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block font-medium">Validity Date</span>
                            <span className={`font-medium ${isExpired ? 'text-red-300 font-bold flex items-center gap-1' : 'text-slate-200'}`}>
                                {isExpired && <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />}
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
                        <div>
                            <span className="text-slate-400 block font-medium">Payment Reference</span>
                            <span className="text-slate-300 font-mono truncate block">
                                {tax.t_paymentReference || "Unpaid"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Body Content Container (Scrollable or Split-View) */}
                <div className="flex-1 flex overflow-hidden bg-slate-50/50">
                    {/* Left / Primary Pane: Assessment & Computation Details */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Expiration warning if applicable */}
                        {isExpired && (
                            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs shadow-xs">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold block text-amber-950">Validity Period Has Expired</span>
                                    The computation validity period for this transaction has lapsed. Surcharge and monthly interest penalties should be recomputed before final approval.
                                </div>
                            </div>
                        )}

                        {/* Existing Approval Stamp if already approved */}
                        {isApproved && (
                            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start justify-between shadow-xs">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                                            Approved Assessment
                                            <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5 font-bold">Official</Badge>
                                        </h4>
                                        <p className="text-xs text-emerald-800 mt-1">
                                            Approved by <span className="font-semibold text-emerald-950">{tax.t_approvedBy || "Authorized Approver"}</span> on{" "}
                                            {tax.t_approvedDate ? format(new Date(tax.t_approvedDate), "MMM d, yyyy • h:mm a") : "Official Record"}.
                                        </p>
                                        {tax.t_approvalRemarks && (
                                            <p className="text-xs text-emerald-900 italic mt-1.5 bg-emerald-100/70 p-2 rounded-lg border border-emerald-200">
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

                        {/* Returned for Revision Stamp if remarks exist and status is pending */}
                        {isPending && tax.t_approvalRemarks && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-xs">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-amber-950">
                                        Returned for Revision Notes
                                    </h4>
                                    <p className="text-xs text-amber-900 mt-1 italic bg-white p-2 rounded-lg border border-amber-200">
                                        "{tax.t_approvalRemarks}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Top Summary Row: Notarial Document Verification & Financial Highlights */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Notarial Document Information Card */}
                            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            Notarial Deed Information
                                        </h4>
                                        {tax.notarialDocument?.document_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => window.open(tax.notarialDocument.document_url, '_blank')}
                                            >
                                                <Paperclip className="w-3.5 h-3.5 mr-1" />
                                                Open Deed
                                                <ExternalLink className="w-3 h-3 ml-1 text-blue-400" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
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

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>Notarial Date: <strong className="text-slate-700">{tax.notarialDocument?.notarialDate ? format(new Date(tax.notarialDocument.notarialDate), "MMMM d, yyyy") : "N/A"}</strong></span>
                                    <span>Days Elapsed: <strong className="text-slate-700">{tax.t_daysElapsed || 0} days</strong></span>
                                </div>
                            </div>

                            {/* Financial Summary Calculation Highlights */}
                            <div className="lg:col-span-6 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100 rounded-xl p-4 shadow-xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <Calculator className="w-4 h-4 text-blue-600" />
                                            Tax Assessment Summary
                                        </h4>
                                        <span className="text-[11px] font-medium text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                                            Rate: 0.75% (Php 500 Min.)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div>
                                            <span className="text-slate-500 block">Total Market Value</span>
                                            <span className="font-mono font-semibold text-slate-800 text-sm">
                                                ₱{totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Total Consideration</span>
                                            <span className="font-mono font-semibold text-slate-800 text-sm">
                                                ₱{totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Assessed Tax Base</span>
                                            <span className="font-mono font-bold text-blue-900 text-sm">
                                                ₱{totalTaxBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-xs mt-3 pt-3 border-t border-blue-100/80">
                                        <div>
                                            <span className="text-slate-500 block">Basic Tax Due</span>
                                            <span className="font-mono font-semibold text-slate-700">
                                                ₱{basicTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Surcharge (25%)</span>
                                            <span className="font-mono font-semibold text-amber-700">
                                                ₱{totalSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Interest ({tax.t_daysElapsed || 0}d)</span>
                                            <span className="font-mono font-semibold text-amber-700">
                                                ₱{totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-blue-200/80 bg-white p-2.5 rounded-lg flex items-center justify-between shadow-xs">
                                    <span className="text-xs uppercase font-bold text-slate-600 tracking-wide">Grand Total Tax Due</span>
                                    <span className="font-black text-emerald-600 text-xl font-mono">
                                        ₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Properties & Tax Apportionment Breakdown Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                            <div className="bg-slate-100/80 px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-blue-600" />
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Properties & Apportionment Breakdown
                                    </h4>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span><strong>{details.length}</strong> Parcel(s) Assessed</span>
                                    <span>•</span>
                                    <span>Total Area: <strong className="font-mono text-slate-700">{totalArea.toLocaleString()} sqm</strong></span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2.5 w-10 text-center">#</th>
                                            <th className="px-3 py-2.5">Tax Dec No.</th>
                                            <th className="px-3 py-2.5">Lot No.</th>
                                            <th className="px-3 py-2.5">Transaction Type</th>
                                            <th className="px-3 py-2.5">Transferor</th>
                                            <th className="px-3 py-2.5">Transferee</th>
                                            <th className="px-3 py-2.5 text-right">Area (sqm)</th>
                                            <th className="px-3 py-2.5 text-right">Market Value</th>
                                            <th className="px-3 py-2.5 text-right">Consideration</th>
                                            <th className="px-3 py-2.5 text-right">Tax Base</th>
                                            <th className="px-3 py-2.5 text-right">Tax Due</th>
                                            <th className="px-3 py-2.5 text-right">Surcharge</th>
                                            <th className="px-3 py-2.5 text-right">Interest</th>
                                            <th className="px-3 py-2.5 text-right font-bold">Sub Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {details.length === 0 ? (
                                            <tr>
                                                <td colSpan={14} className="text-center py-8 text-slate-500">
                                                    No parcel details found for this computation.
                                                </td>
                                            </tr>
                                        ) : (
                                            details.map((dt: any, index: number) => {
                                                const parcelArea = Number(dt.nt_area || dt.realProperty?.area || 0);
                                                const mv = Number(dt.nt_marketvalue || 0);
                                                const cv = Number(dt.nt_considerationvalue || 0);
                                                const tb = Number(dt.nt_taxbase || Math.max(mv, cv));
                                                const td = Number(dt.nt_transfertaxDue || Math.max(tb * 0.0075, 500));
                                                const sc = Number(dt.nt_surcharge || 0);
                                                const it = Number(dt.nt_interest || 0);
                                                const st = Number(dt.nt_totalTransferTaxDue || (td + sc + it));

                                                return (
                                                    <tr key={dt.id || index} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-3 py-2.5 text-center text-slate-400 font-mono">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                                                            <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                                                                {dt.realProperty?.taxdecnumber || dt.nt_taxdecnumber || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">
                                                            {dt.realProperty?.lotnumber || dt.nt_lotnumber || "—"}
                                                        </td>
                                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">
                                                                {dt.nt_transactiontype || "Sale"}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-slate-700 max-w-[140px] truncate" title={dt.nt_transferror || "N/A"}>
                                                            {dt.nt_transferror || "N/A"}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[140px] truncate" title={dt.nt_transferee || "N/A"}>
                                                            {dt.nt_transferee || "N/A"}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                                                            {parcelArea.toLocaleString()}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                                                            ₱{mv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                                                            ₱{cv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-medium text-blue-900 whitespace-nowrap">
                                                            ₱{tb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                                                            ₱{td.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-amber-700 whitespace-nowrap">
                                                            ₱{sc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-amber-700 whitespace-nowrap">
                                                            ₱{it.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap bg-slate-50/50">
                                                            ₱{st.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                                        <tr>
                                            <td colSpan={6} className="px-3 py-2.5 text-slate-700 uppercase tracking-wider text-[11px]">
                                                TOTALS ({details.length} parcel{details.length === 1 ? '' : 's'})
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                                                {totalArea.toLocaleString()} sqm
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                                                ₱{totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                                                ₱{totalConsideration.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-blue-900 whitespace-nowrap">
                                                ₱{totalTaxBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-800 whitespace-nowrap">
                                                ₱{basicTaxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-amber-800 whitespace-nowrap">
                                                ₱{totalSurcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-amber-800 whitespace-nowrap">
                                                ₱{totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-mono text-emerald-700 text-sm whitespace-nowrap bg-emerald-50/50">
                                                ₱{totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Approver Action Panel */}
                        {isApprover ? (
                            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                        Approver Review Notes & Decision
                                    </span>
                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                                        Signed in as {currentUser?.name || "Approver"} ({currentUser?.role || "APPROVER"})
                                    </Badge>
                                </div>

                                <Textarea
                                    placeholder="Add approval remarks or specific reasons for returning this computation (e.g. 'Computation verified against Deed of Absolute Sale', 'Please re-verify consideration on parcel 2')..."
                                    value={remarks}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                                    className="text-xs bg-slate-50/50 resize-none min-h-[70px]"
                                    rows={2}
                                    disabled={isSubmitting}
                                />
                            </div>
                        ) : (
                            <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600">
                                <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                    <span className="font-semibold text-slate-800">Audit & Read-Only Mode</span>
                                    <p className="text-slate-500">
                                        You are currently reviewing this computation in read-only audit mode. To officially approve or return assessments, an account with the <span className="font-semibold text-slate-700">APPROVER</span> or <span className="font-semibold text-slate-700">ADMIN</span> role is required.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right / Secondary Pane: Embedded Live Attached Deed PDF Preview */}
                    {showDeedPreview && tax.notarialDocument?.document_url && (
                        <div className="w-1/2 min-w-[380px] h-full flex flex-col border-l border-slate-200 bg-slate-100">
                            <div className="p-3 bg-slate-200/70 border-b border-slate-300 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                                    Attached Notarial Deed Document
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[11px] text-blue-700 hover:bg-blue-100"
                                        onClick={() => window.open(tax.notarialDocument.document_url, '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        New Tab
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-300"
                                        onClick={() => setShowDeedPreview(false)}
                                        title="Close Deed Preview"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex-1 w-full h-full p-2 bg-slate-200/40">
                                <iframe 
                                    src={tax.notarialDocument.document_url} 
                                    className="w-full h-full rounded-lg border border-slate-300 bg-white shadow-xs" 
                                    title="Notarial Document Preview"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls & Resize Drag Handle */}
                <DialogFooter className="p-4 bg-slate-100/90 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3 relative select-none">
                    {/* Left: Size info & quick reset */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                            View Mode: <strong className="text-slate-700 font-medium">{customSize ? `Custom (${customSize.width} × ${customSize.height}px)` : sizePreset.toUpperCase()}</strong>
                        </span>
                        <span className="hidden md:inline">• Drag bottom-right corner to freely resize</span>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 pr-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Close
                        </Button>

                        {isApprover && isPending && (
                            <>
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
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold px-4"
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
                            </>
                        )}
                    </div>

                    {/* Resizable Corner Handle */}
                    <div 
                        onMouseDown={handleResizeMouseDown}
                        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 text-slate-400 hover:text-blue-600 transition-colors z-20 group"
                        title="Click and drag to freely resize dialog width and height"
                    >
                        <svg className="w-3.5 h-3.5 fill-current opacity-60 group-hover:opacity-100" viewBox="0 0 10 10">
                            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="8" y1="5" x2="5" y2="8" stroke="currentColor" strokeWidth="1.5" />
                            <line x1="8" y1="8" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
