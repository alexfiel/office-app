"use client"

import React, { useState } from 'react';
import { 
    MoreHorizontal, 
    Trash2, 
    Edit3, 
    Eye, 
    AlertTriangle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { voidExternalFVSettlement, updateExternalFVSettlementBatch } from "@/lib/actions/external-fv-settlement";

interface ExternalSettlementActionsProps {
    settlement: {
        id: string;
        arNo: string;
        batchNo: string;
    };
    onViewDetails: () => void;
}

export function ExternalSettlementActions({ settlement, onViewDetails }: ExternalSettlementActionsProps) {
    const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
    const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newBatchNo, setNewBatchNo] = useState(settlement.batchNo);

    const handleVoid = async () => {
        setIsSubmitting(true);
        try {
            await voidExternalFVSettlement(settlement.id);
            toast.success(`AR ${settlement.arNo} has been voided successfully.`);
            setIsVoidDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to void settlement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateBatch = async () => {
        if (!newBatchNo.trim()) {
            toast.error("Batch number cannot be empty");
            return;
        }

        setIsSubmitting(true);
        try {
            await updateExternalFVSettlementBatch(settlement.id, newBatchNo);
            toast.success(`Batch number updated to ${newBatchNo}`);
            setIsBatchDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Failed to update batch number");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={onViewDetails}>
                        <Eye className="mr-2 h-4 w-4 text-blue-600" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsBatchDialogOpen(true)}>
                        <Edit3 className="mr-2 h-4 w-4 text-amber-600" />
                        Edit Batch No
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => setIsVoidDialogOpen(true)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Void AR
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Void Confirmation Dialog */}
            <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Void Acknowledgement Receipt
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to void <span className="font-bold text-slate-900">{settlement.arNo}</span>? 
                            This action will remove it from the liquidation queue and cannot be easily undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsVoidDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleVoid}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Confirm Void
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Batch Dialog */}
            <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Edit3 className="h-5 w-5 text-amber-600" />
                            Update Batch Number
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Modify the batch number for AR <span className="font-mono font-bold text-blue-600">{settlement.arNo}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="batchNo" className="text-right">
                                Batch Number
                            </Label>
                            <Input
                                id="batchNo"
                                value={newBatchNo}
                                onChange={(e) => setNewBatchNo(e.target.value)}
                                className="col-span-3 font-mono"
                                placeholder="Enter batch number..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsBatchDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleUpdateBatch}
                            disabled={isSubmitting || newBatchNo === settlement.batchNo}
                            className="bg-slate-900 hover:bg-black text-white"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Update Batch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
