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
}

export function PropertyCartStep({ cart, onRemove, onBack, onNext }: PropertyCartStepProps) {

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
                        <PropertyTable
                            properties={cart}
                            onRemove={onRemove}
                            showActions={true}
                        />

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
                                    {totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    className="min-w-[200px] font-bold shadow-lg"
                >
                    NEXT: ASSIGN PARTIES →
                </Button>
            </CardFooter>
        </Card>
    )
}