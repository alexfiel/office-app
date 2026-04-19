"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteTripLog } from '@/lib/upload/librengsakay/liquidation';
import { Trash2 } from 'lucide-react';

export default function DeleteTrip({ trip, isPending = true, onSuccess }: { trip: any, isPending?: boolean, onSuccess: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!trip?.id) return;
        setIsDeleting(true);
        try {
            await deleteTripLog(trip.id);
            toast.success("Trip successfully deleted.");
            setIsOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete trip.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button
                    disabled={!isPending}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ml-2 inline-flex items-center ${
                        isPending 
                            ? 'text-red-600 hover:text-red-800 bg-red-50 border-red-100' 
                            : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
                    }`}
                    title={isPending ? "Delete Trip" : "Cannot delete a liquidated (Done) trip"}
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Trip Log</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete the trip for <strong>{trip?.driverName}</strong> on {trip?.departureDate && new Date(trip.departureDate).toLocaleDateString()}?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete Trip"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
