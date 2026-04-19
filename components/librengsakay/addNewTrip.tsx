"use client";

import React, { useState } from 'react';
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createTripLog } from '@/lib/upload/librengsakay/liquidation';
import { PlusCircle } from 'lucide-react';

export default function AddNewTrip({ routes, onSuccess }: { routes: any[], onSuccess: () => void }) {
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;

    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        driverName: '',
        vehiclePlateNumber: '',
        numberofPax: 0,
        fare: 0,
        amount: 0,
        routeId: '',
        departureDate: ''
    });

    const handleSubmit = async () => {
        if (!userId) {
            toast.error("User not authenticated.");
            return;
        }
        if (!form.driverName || !form.vehiclePlateNumber || !form.routeId || !form.departureDate) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSaving(true);
        try {
            await createTripLog({
                driverName: form.driverName,
                vehiclePlateNumber: form.vehiclePlateNumber,
                numberofPax: form.numberofPax,
                fare: form.fare,
                amount: form.amount,
                routeId: form.routeId,
                departureDate: new Date(form.departureDate)
            }, userId);
            toast.success("Trip successfully added.");
            setIsOpen(false);
            setForm({ driverName: '', vehiclePlateNumber: '', numberofPax: 0, fare: 0, amount: 0, routeId: '', departureDate: '' });
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Failed to add trip.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-semibold text-sm shadow-sm">
                    <PlusCircle className="w-4 h-4" />
                    <span>Add New Trip</span>
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Trip</DialogTitle>
                    <DialogDescription>
                        Fill out the details for the new trip log.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={form.departureDate}
                            onChange={(e) => setForm(prev => ({ ...prev, departureDate: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Destination Route</Label>
                        <select
                            className="w-full px-4 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            value={form.routeId}
                            onChange={(e) => setForm(prev => ({ ...prev, routeId: e.target.value }))}
                        >
                            <option value="">Select a route...</option>
                            {routes?.map((route: any) => (
                                <option key={route.id} value={route.id}>
                                    {route.routeName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Driver Name</Label>
                        <Input
                            value={form.driverName}
                            onChange={(e) => setForm(prev => ({ ...prev, driverName: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Vehicle Plate Number</Label>
                        <Input
                            value={form.vehiclePlateNumber}
                            onChange={(e) => setForm(prev => ({ ...prev, vehiclePlateNumber: e.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Number of Pax</Label>
                        <Input
                            type="number"
                            value={form.numberofPax || ""}
                            onChange={(e) => {
                                const pax = Number(e.target.value);
                                setForm(prev => ({
                                    ...prev,
                                    numberofPax: pax,
                                    amount: pax * prev.fare 
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fare (₱)</Label>
                        <Input
                            type="number"
                            value={form.fare || ""}
                            onChange={(e) => {
                                const newFare = Number(e.target.value);
                                setForm(prev => ({
                                    ...prev,
                                    fare: newFare,
                                    amount: prev.numberofPax * newFare 
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Total Amount (₱)</Label>
                        <Input
                            type="number"
                            value={form.amount || ""}
                            onChange={(e) => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Trip"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
