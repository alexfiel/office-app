"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PropertyTable } from "./PropertyTable"
import { RealPropertyInfo } from "@/lib/types/property"
import { AlertCircle, ShoppingCart, Trash2 } from "lucide-react"

interface PropertyCartStepProps {
    cart: RealPropertyInfo[];
    onRemove: (id: string) => void;
    onBack: () => void;
    onNext: () => void;
    isEJS?: boolean;
    ejsChain?: any[];
}

export function PropertyCartStep({ cart, onRemove, onBack, onNext, onTriggerEjsTransfer, isEJS, ejsChain = [] }: PropertyCartStepProps) {

    // Calculate aggregate market value for the cart
    const totalMarketValue = cart.reduce((total, item) => {
        const val = typeof item.marketValue === 'string' ? parseFloat(item.marketValue) : item.marketValue;
        return total + (isNaN(val) ? 0 : val);
    }, 0);

    const isEmpty = cart.length === 0;

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <CardTitle className="font-small-caps">PROPERTY CART & COMPUTATION</CardTitle>
                </div>
                <CardDescription>
                    REVIEW THE SELECTED PROPERTIES. YOU CAN REMOVE ITEMS OR GO BACK TO ADD MORE.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
                        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                        <p className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
                            YOUR CART IS CURRENTLY EMPTY
                        </p>
                        <Button variant="link" onClick={onBack} className="mt-2 text-primary font-bold">
                            ← RETURN TO PROPERTY SEARCH
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* The PropertyTable handles the actual mapping of data */}
                        <div className="space-y-4">
                            {cart.map((item) => {
                                const propertyTransfers = ejsChain.filter(tx => tx.propertyId === item.id);
                                const totalAssignedShare = propertyTransfers.reduce((sum, tx) => sum + (Number(tx.share) || 0), 0);
                                const isShareComplete = totalAssignedShare >= 0.999; // Handle float floating point

                                return (
                                    <div key={item.id} className="border rounded-xl bg-white shadow-sm overflow-hidden border-slate-200">
                                        <div className="p-5 flex justify-between items-start bg-slate-50/50">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm uppercase tracking-tight text-slate-900">{item.taxdecnumber} | LOT {item.lotNumber}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase mt-1">LATEST OWNER: {item.owner}</p>
                                                <div className="flex gap-4 mt-2">
                                                    <p className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">MV: P {Number(item.marketValue).toLocaleString()}</p>
                                                    {isEJS && (
                                                        <p className={`text-[11px] font-bold px-2 py-0.5 rounded border ${isShareComplete ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                            ASSIGNED: {(totalAssignedShare * 100).toFixed(0)}%
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {isEJS && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => onTriggerEjsTransfer?.(item)}
                                                        className="text-[10px] font-bold h-8 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                                        disabled={isShareComplete}
                                                    >
                                                        + ESTATE TRANSFER
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onRemove(item.id)}
                                                    className="h-8 w-8 text-slate-400 hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* CHAIN OF TRANSFERS VIEW */}
                                        {isEJS && propertyTransfers.length > 0 && (
                                            <div className="bg-white border-t border-slate-100 p-4 space-y-3">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-blue-400">Recorded Transfers</h4>
                                                <div className="space-y-2">
                                                    {propertyTransfers.map((tx, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-xs p-3 rounded-lg border border-slate-100 bg-blue-50/30 group">
                                                            <div>
                                                                <p className="font-bold text-slate-800">{tx.deceasedOwner} → {tx.heirs}</p>
                                                                <p className="text-[10px] text-slate-500 uppercase">Share: {tx.shareString || tx.share}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-mono font-bold text-slate-900">P {tx.basicTaxDue.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Highlighted Total Box */}
                        <div className="bg-primary/5 p-5 rounded-xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <ShoppingCart className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Aggregate Count</p>
                                    <p className="text-sm font-bold">{cart.length} PROPERTY/IES</p>
                                </div>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-primary">Total Market Value (PHP)</p>
                                <p className="text-3xl font-mono font-black text-primary">
                                    {isEJS ? "N/A" : totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <p className="text-[10px] text-amber-800 font-medium uppercase italic">
                                Notice: This total will serve as the tax base unless the Consideration Price is higher.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-6">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="font-bold border-2"
                >
                    BACK: SEARCH
                </Button>
                <Button
                    onClick={onNext}
                    disabled={isEmpty}
                    className={`min-w-[200px] font-bold shadow-lg ${isEJS ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                    {isEJS ? 'NEXT: REVIEW SUMMARY →' : 'NEXT: ASSIGN PARTIES →'}
                </Button>
            </CardFooter>
        </Card>
    )
}