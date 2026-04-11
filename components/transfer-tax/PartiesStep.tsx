"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { UserCircle2, ArrowRightLeft } from "lucide-react"

interface PartiesStepProps {
    prevOwner: string;
    newOwner: string;
    onPrevOwnerChange: (val: string) => void;
    onNewOwnerChange: (val: string) => void;
    // Financials for the mini-preview
    taxBase: number;
    totalDue: number;
    onBack: () => void;
    onNext: () => void;
}

export function PartiesStep({
    prevOwner,
    newOwner,
    onPrevOwnerChange,
    onNewOwnerChange,
    taxBase,
    totalDue,
    onBack,
    onNext
}: PartiesStepProps) {

    const isComplete = prevOwner.trim() !== "" && newOwner.trim() !== "";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-primary" />
                    <CardTitle className="font-small-caps">TRANSFER OF OWNERSHIP</CardTitle>
                </div>
                <CardDescription>
                    ENTER THE FULL NAMES OF THE PARTIES INVOLVED. THESE WILL APPEAR ON THE FINAL TAX CERTIFICATE.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <Field>
                        <Label className="font-bold">PREVIOUS OWNER (TRANSFEROR) <span className="text-destructive">*</span></Label>
                        <Input
                            value={prevOwner}
                            onChange={(e) => onPrevOwnerChange(e.target.value)}
                            placeholder="ENTER FULL NAME OF SELLER / DONOR"
                            className="uppercase font-medium"
                        />
                    </Field>

                    <div className="hidden md:flex justify-center pt-6">
                        <ArrowRightLeft className="text-muted-foreground h-6 w-6" />
                    </div>

                    <Field>
                        <Label className="font-bold">NEW OWNER (TRANSFEREE) <span className="text-destructive">*</span></Label>
                        <Input
                            value={newOwner}
                            onChange={(e) => onNewOwnerChange(e.target.value)}
                            placeholder="ENTER FULL NAME OF BUYER / DONEE"
                            className="uppercase font-medium"
                        />
                    </Field>
                </div>

                {/* Live Computation Preview Box */}
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-xs font-black uppercase tracking-tighter text-muted-foreground mb-4">Live Computation Preview</h3>
                    <div className="bg-muted/30 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Computed Tax Base:</p>
                            <p className="text-xl font-mono">P {taxBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-1 md:text-right">
                            <p className="text-[10px] font-bold text-primary uppercase">Total Amount Due (Incl. Penalties):</p>
                            <p className="text-2xl font-mono font-black text-primary">P {(totalDue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} className="font-bold">BACK</Button>
                <Button
                    onClick={onNext}
                    disabled={!isComplete}
                    className="min-w-[180px] font-bold"
                >
                    NEXT: FINAL SUMMARY
                </Button>
            </CardFooter>
        </Card>
    )
}