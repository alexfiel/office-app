"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { cn } from "@/lib/utils"


interface EJSTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: any;
    onAddTransfer: (transfer: any) => void;

}

export function EJSTransferModal({ isOpen, onClose, property, onAddTransfer }: EJSTransferModalProps) {
    const [deceasedOwner, setDeceasedOwner] = useState("")
    const [heirs, setHeirs] = useState("")
    const [share, setShare] = useState("1") // Default to 100% or 1/1

    // Split the property owners into an array (assuming comma-separated in DB)
    const currentOwners = property?.owner?.split(";").map((o: string) => o.trim()).filter(Boolean) || []

    const handleAdd = () => {
        // Compute base for this specific transfer
        // Math: Tax Base = Market Value * ( numerator / denominator)

        const numericShare = eval(share) || 1; // Allows "1/2" or "0.5"
        const taxBase = property.marketValue * numericShare;
        const basicTaxDue = Math.max(taxBase * 0.0075, 500)

        onAddTransfer({
            propertyId: property.id,
            tdNo: property.taxdecnumber,
            deceasedOwner,
            heirs,
            share: numericShare,
            shareString: share,
            taxBase,
            basicTaxDue,
        });

        // Reset and close
        setDeceasedOwner("")
        setHeirs("")
        setShare("1")
        onClose()

    }
    const getModalWidth = () => {
        const length = deceasedOwner?.length || 0;
        if (length > 40) return "sm:max-w-[800px]";
        if (length > 25) return "sm:max-w-[600px]";
        return "sm:max-w-[425px]";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(
                "max-h-[95vh] overflow-y-auto transition-all duration-300 ease-in-out",
                getModalWidth()
            )}>
                <DialogHeader>
                    <DialogTitle className="font-small-caps">Add Estate Transfer</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Determine the deceased owner */}
                    <div className="space-y-2">
                        <Label>Select Deceased Owner</Label>
                        <Select onValueChange={setDeceasedOwner} value={deceasedOwner}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose from current owners..." />
                            </SelectTrigger>
                            <SelectContent>
                                {currentOwners.map((owner: string) => (
                                    <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Transfer to Heirs */}
                    <div className="space-y-2">
                        <Label>Heirs (New Owners)</Label>
                        <Input
                            value={heirs}
                            onChange={(e) => setHeirs(e.target.value)}
                            placeholder="List all heirs (e.g., Juan, Pedro, Maria)"
                        />
                    </div>

                    {/* Share of the deceased */}
                    <div className="space-y-2">
                        <Label>Share of the Deceased</Label>
                        <Input
                            value={share}
                            onChange={(e) => setShare(e.target.value)}
                            placeholder="e.g., 1/2 or 0.5"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Tax Base: $MarketValue \ times {share}$
                        </p>
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>CANCEL</Button>
                    <Button onClick={handleAdd} disabled={!deceasedOwner || !heirs}>
                        COMMIT TRANSFER
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
