"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBasicTransferTax } from "@/lib/actions/transfertax-actions";
import { toast } from "sonner";
import { Save, AlertTriangle } from "lucide-react";

interface TransferTaxEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    taxData: any; // NewTransferTax with t_transfertaxdetails
    isAdmin: boolean;
    onSuccess: () => void;
    onFullRevert: () => void;
}

export function TransferTaxEditDialog({ open, onOpenChange, taxData, isAdmin, onSuccess, onFullRevert }: TransferTaxEditDialogProps) {
    const [details, setDetails] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (taxData && open) {
            // Deep copy the details so we can edit them
            setDetails(JSON.parse(JSON.stringify(taxData.t_transfertaxdetails || [])));
        }
    }, [taxData, open]);

    const handleDetailChange = (index: number, field: string, value: string) => {
        const updated = [...details];
        updated[index][field] = value;
        setDetails(updated);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Send the updated details to the server
            const payload = details.map(d => ({
                id: d.id,
                transferee: d.nt_transferee,
                transferror: d.nt_transferror,
                considerationValue: Number(d.nt_considerationvalue) || 0
            }));

            const res = await updateBasicTransferTax(taxData.id, payload);
            
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Transaction updated and taxes recomputed successfully.");
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!taxData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b bg-gray-50/50">
                    <DialogTitle className="text-xl">Edit Transaction: {taxData.t_controlNumber}</DialogTitle>
                    <DialogDescription>
                        Modify names and consideration values. Changes will automatically recompute the transfer tax, surcharge, and interest based on the original computation date.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {details.map((detail, index) => (
                        <div key={detail.id} className="p-4 border rounded-xl bg-white shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="font-semibold text-blue-800">
                                    Property {index + 1}
                                </h4>
                                <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    TD: {detail.nt_taxdecnumber} | Lot: {detail.nt_lotnumber || "N/A"}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Transferee Name</Label>
                                    <Input 
                                        value={detail.nt_transferee} 
                                        onChange={(e) => handleDetailChange(index, "nt_transferee", e.target.value.toUpperCase())}
                                        className="uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Transferor Name</Label>
                                    <Input 
                                        value={detail.nt_transferror} 
                                        onChange={(e) => handleDetailChange(index, "nt_transferror", e.target.value.toUpperCase())}
                                        className="uppercase"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Consideration Value (₱)</Label>
                                    <Input 
                                        type="number"
                                        value={detail.nt_considerationvalue} 
                                        onChange={(e) => handleDetailChange(index, "nt_considerationvalue", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-500">Market Value (₱)</Label>
                                    <Input 
                                        disabled
                                        value={Number(detail.nt_marketvalue).toLocaleString()} 
                                        className="bg-gray-50 text-gray-500 font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="p-4 border-t bg-gray-50/50 flex sm:justify-between items-center sm:flex-row flex-col gap-4">
                    {isAdmin ? (
                        <Button 
                            type="button" 
                            variant="destructive" 
                            className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                            onClick={() => {
                                onOpenChange(false);
                                onFullRevert();
                            }}
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Full Revert & Redo (Admin)
                        </Button>
                    ) : (
                        <div /> // Spacer
                    )}
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                            {isSaving ? "Saving..." : "Save Changes"}
                            {!isSaving && <Save className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
