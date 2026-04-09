"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/ui/field"

interface TransactionStepProps {
    transactionType: string;
    consideration: number | "";
    onTypeChange: (type: string) => void;
    onConsiderationChange: (value: number | "") => void;
    onBack: () => void;
    onNext: () => void;
}

const TRANSACTION_OPTIONS = [
    "DEED OF SALE",
    "DEED OF DONATION",
    "DEED OF EXTRAJUDICIAL SETTLEMENT"
];

export default function TransactionStep({
    transactionType,
    consideration,
    onTypeChange,
    onConsiderationChange,
    onBack,
    onNext
}: TransactionStepProps) {

    const handleReset = () => {
        onTypeChange("");
        onConsiderationChange("");
    };

    // Validation: Sale needs consideration, others just need the type selected
    const isComplete = transactionType === "DEED OF SALE"
        ? (transactionType && consideration !== "" && consideration > 0)
        : !!transactionType;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-small-caps">SELECTION OF TRANSACTION</CardTitle>
                <CardDescription>
                    {transactionType
                        ? "REVIEW YOUR SELECTED TRANSACTION TYPE BELOW."
                        : "CHOOSE THE TYPE OF TRANSACTION FOR THESE PROPERTIES."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                    {TRANSACTION_OPTIONS.map((type) => {
                        // HIDE logic: If something is selected, hide everything except the selection
                        if (transactionType && transactionType !== type) return null;

                        return (
                            <label
                                key={type}
                                className={`flex items-center gap-2 cursor-pointer border p-4 rounded-md transition-all ${transactionType === type
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'hover:bg-muted/50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="transaction"
                                    value={type}
                                    checked={transactionType === type}
                                    onChange={(e) => onTypeChange(e.target.value)}
                                    className="size-4"
                                />
                                <span className="font-bold uppercase tracking-wide">{type}</span>
                                {transactionType === type && (
                                    <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
                                        SELECTED
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>

                {transactionType && (
                    <div className="flex justify-end animate-in fade-in zoom-in duration-300">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="text-xs font-bold border-destructive text-destructive hover:bg-destructive hover:text-white"
                        >
                            ✕ CHANGE SELECTION
                        </Button>
                    </div>
                )}

                {transactionType === "DEED OF SALE" && (
                    <div className="mt-4 p-6 border-2 border-dashed rounded-md bg-muted/20 animate-in slide-in-from-top-4 duration-500">
                        <Field>
                            <Label className="font-bold">CONSIDERATION / SELLING PRICE <span className="text-destructive">*</span></Label>
                            <Input
                                type="number"
                                value={consideration}
                                onChange={(e) => onConsiderationChange(e.target.value === "" ? "" : Number(e.target.value))}
                                placeholder="ENTER THE FULL AMOUNT (E.G. 1500000)"
                                className="uppercase text-lg font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground mt-3 italic leading-tight">
                                NOTE: FOR DEED OF SALE, THE TAX BASE WILL BE THE HIGHER VALUE BETWEEN THE MARKET VALUE AND THIS CONSIDERATION.
                            </p>
                        </Field>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} className="font-bold">
                    BACK
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!isComplete}
                    className="min-w-[180px] font-bold"
                >
                    {isComplete ? 'NEXT: SEARCH PROPERTIES' : 'COMPLETE SELECTION'}
                </Button>
            </CardFooter>
        </Card>
    )
}