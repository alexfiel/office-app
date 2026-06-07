"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight, ArrowLeft, Building2, UserCircle2, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { RealPropertyInfo } from "@/lib/types/property";
import { Checkbox } from "@/components/ui/checkbox";

const parseOwners = (ownerStr: string) => {
    if (!ownerStr) return [];
    let s = ownerStr.toUpperCase();
    const delimiters = ["SPS.", "SPS", "M/T", "MARRIED TO", "MARRIED", " AND ", "&", ";", ","];

    delimiters.forEach(d => {
        s = s.split(d).join("|");
    });

    const parsed = s.split("|")
        .map(n => n.trim())
        .filter(n => n.length > 2 && n !== "ET AL" && n !== "ET AL." && n !== "AND");

    return parsed.length > 0 ? parsed : [ownerStr.trim()];
};

type EjsData = {
    parsedOwners: string[];
    selectedOwners: string[];
    adjustedMarketValue: number;
};

export function TransferTaxTransaction() {
    const router = useRouter();
    const [cart, setCart] = useState<RealPropertyInfo[]>([]);

    const [transferee, setTransferee] = useState("");
    const [transferor, setTransferor] = useState("");
    const [transactionType, setTransactionType] = useState("");
    const [considerationValue, setConsiderationValue] = useState("");
    const [propertyEjsData, setPropertyEjsData] = useState<Record<string, EjsData>>({});

    const EJS_TYPES = ["Extrajudicial Settlement", "Donation", "Waiver of Rights"];
    const isEjsType = EJS_TYPES.includes(transactionType);

    // Load data from cookies
    useEffect(() => {
        try {
            // Load Cart
            const cartMatch = document.cookie.match(new RegExp('(^| )rpt-cart=([^;]+)'));
            if (cartMatch) {
                const storedCart = JSON.parse(decodeURIComponent(cartMatch[2]));
                if (Array.isArray(storedCart) && storedCart.length > 0) {
                    // eslint-disable-next-line
                    setCart(storedCart);
                } else {
                    toast.error("No properties selected. Redirecting to search.");
                    router.push("/newTransferTax/search-property");
                }
            } else {
                toast.error("No properties selected. Redirecting to search.");
                router.push("/newTransferTax/search-property");
            }

            // Load saved transaction data if coming back from step 4
            const txMatch = document.cookie.match(new RegExp('(^| )transferTaxTransaction=([^;]+)'));
            if (txMatch) {
                const txData = JSON.parse(decodeURIComponent(txMatch[2]));

                if (txData.transferee) setTransferee(txData.transferee);

                if (txData.transferor) setTransferor(txData.transferor);

                if (txData.transactionType) setTransactionType(txData.transactionType);

                if (txData.considerationValue) setConsiderationValue(txData.considerationValue.toString());

                if (txData.propertyEjsData) setPropertyEjsData(txData.propertyEjsData);
            }
        } catch (e) {
            console.error("Failed to parse cookies", e);
        }
    }, [router]);

    // Initialize EJS Data when transaction type changes
    useEffect(() => {
        if (isEjsType && cart.length > 0) {
            // eslint-disable-next-line
            setPropertyEjsData(prev => {
                const newData = { ...prev };
                let changed = false;
                cart.forEach(p => {
                    if (!newData[p.id]) {
                        newData[p.id] = {
                            parsedOwners: parseOwners(p.owner),
                            selectedOwners: [],
                            adjustedMarketValue: 0
                        };
                        changed = true;
                    }
                });
                return changed ? newData : prev;
            });
        }
    }, [isEjsType, cart]);

    // Auto-populate Transferor based on selected distinct owners
    useEffect(() => {
        if (isEjsType) {
            const allSelected = new Set<string>();
            Object.values(propertyEjsData).forEach(pData => {
                pData.selectedOwners.forEach(o => allSelected.add(o));
            });
            const distinctSelected = Array.from(allSelected);
            // eslint-disable-next-line
            setTransferor(distinctSelected.join(", "));
        } else if (cart.length > 0) {
            const allOwners = new Set<string>();
            cart.forEach(p => {
                parseOwners(p.owner).forEach(o => allOwners.add(o));
            });
            const distinctOwners = Array.from(allOwners);
            // Only auto-populate if we haven't typed anything yet, or if we want to force it
            // Let's force it to ensure consistency with distinct owners of the cart
            // eslint-disable-next-line
            setTransferor(distinctOwners.join(", "));
        }
    }, [propertyEjsData, isEjsType, cart]);

    const handleNext = () => {
        if (!transferee || !transferor || !transactionType || (transactionType === "Sale" && !considerationValue)) {
            toast.error("Please fill in all transaction details.");
            return;
        }

        const transactionData = {
            transferee,
            transferor,
            transactionType,
            considerationValue: parseFloat(considerationValue) || 0,
            propertyEjsData: isEjsType ? propertyEjsData : undefined
        };

        // Save data in cookies
        document.cookie = `transferTaxTransaction=${encodeURIComponent(JSON.stringify(transactionData))}; path=/; max-age=86400`;

        console.log("Transaction details saved:", transactionData);
        // Navigate to Step 4 (Computation / Review)
        router.push("/newTransferTax/computation");
    };

    const handleBack = () => {
        router.push("/newTransferTax/search-property");
    };

    const totalMarketValue = cart.reduce((acc, property) => {
        const pData = propertyEjsData[property.id];
        let displayValue = Number(property.marketValue);

        if (isEjsType && pData) {
            const totalOwners = pData.parsedOwners.length;
            const selectedCount = pData.selectedOwners.length;
            if (totalOwners > 0 && selectedCount > 0) {
                displayValue = (displayValue / totalOwners) * selectedCount;
            } else if (totalOwners > 0) {
                displayValue = 0;
            }
        }
        return acc + displayValue;
    }, 0);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <Card className="border-2 shadow-lg rounded-2xl overflow-hidden bg-white mb-8">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 pt-8 pb-6 px-6 border-b">
                    <CardHeader className="text-center space-y-4 p-0">
                        <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                            <UserCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="space-y-1.5">
                            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                                Transaction Details
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 max-w-md mx-auto">
                                Enter the transaction details for the selected properties to compute the transfer tax.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </div>

                <CardContent className="p-6 sm:p-10 space-y-8">
                    {/* Selected Properties Summary */}
                    <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Properties Subject to Transfer ({cart.length})</h3>
                            <div className="text-left sm:text-right bg-emerald-50 px-3 py-1 rounded border border-emerald-100">
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mr-2">Total Market Value:</span>
                                <span className="font-bold text-emerald-700 text-sm">₱{totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {cart.map((property) => {
                                const pData = propertyEjsData[property.id];
                                let displayValue = Number(property.marketValue);

                                if (isEjsType && pData) {
                                    const totalOwners = pData.parsedOwners.length;
                                    const selectedCount = pData.selectedOwners.length;
                                    if (totalOwners > 0 && selectedCount > 0) {
                                        displayValue = (displayValue / totalOwners) * selectedCount;
                                    } else if (totalOwners > 0) {
                                        displayValue = 0; // Or keep original? The spec implies fraction based on selected
                                    }
                                }

                                return (
                                    <div key={property.id} className="flex flex-col gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2.5 rounded-lg bg-gray-200/50 text-gray-500 shrink-0">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{property.owner}</h4>
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        Tax Dec: <span className="font-medium text-gray-900">{property.taxdecnumber}</span>
                                                        <span className="mx-2">•</span>
                                                        Area: <span className="font-medium text-gray-900">{property.area} sq.m.</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    {isEjsType ? "Adjusted Market Value" : "Market Value"}
                                                </p>
                                                <p className="font-bold text-gray-900">₱{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        {isEjsType && pData && pData.parsedOwners.length > 0 && (
                                            <div className="mt-2 pt-4 border-t border-gray-200/60 animate-in fade-in duration-300">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        Select owner(s) {transactionType === "Extrajudicial Settlement" ? "who are deceased:" : "waiving / donating their share:"}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {pData.parsedOwners.map((ownerName, idx) => (
                                                        <div key={idx} className="flex items-center space-x-2 bg-white p-2 rounded-md border border-gray-100 shadow-sm">
                                                            <Checkbox
                                                                id={`${property.id}-owner-${idx}`}
                                                                checked={pData.selectedOwners.includes(ownerName)}
                                                                onCheckedChange={(checked) => {
                                                                    setPropertyEjsData(prev => {
                                                                        const curr = prev[property.id];
                                                                        const nextSelected = checked
                                                                            ? [...curr.selectedOwners, ownerName]
                                                                            : curr.selectedOwners.filter(n => n !== ownerName);

                                                                        // Precompute adjusted market value
                                                                        const tOwners = curr.parsedOwners.length;
                                                                        const sCount = nextSelected.length;
                                                                        const adjustedValue = (tOwners > 0 && sCount > 0)
                                                                            ? (Number(property.marketValue) / tOwners) * sCount
                                                                            : 0;

                                                                        return { ...prev, [property.id]: { ...curr, selectedOwners: nextSelected, adjustedMarketValue: adjustedValue } };
                                                                    });
                                                                }}
                                                            />
                                                            <label
                                                                htmlFor={`${property.id}-owner-${idx}`}
                                                                className="text-sm font-medium leading-tight cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                                                            >
                                                                {ownerName}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                                {pData.selectedOwners.length > 0 && (
                                                    <div className="mt-4 inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
                                                        Fractional Share Applied: {pData.selectedOwners.length} of {pData.parsedOwners.length}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="mt-8 space-y-5">
                        <div className="flex items-center gap-2 border-b pb-2 border-gray-200/60">
                            <h3 className="text-lg font-semibold text-gray-800">Transfer Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="transferor" className="text-sm font-medium text-gray-700">Transferor (Seller / Donor)</Label>
                                <Input
                                    id="transferor"
                                    placeholder="e.g. Juan Dela Cruz"
                                    value={transferor}
                                    onChange={(e) => setTransferor(e.target.value)}
                                    className="bg-gray-50/50 focus:bg-white shadow-sm h-11 uppercase"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transferee" className="text-sm font-medium text-gray-700">Transferee (Buyer / Donee)</Label>
                                <Input
                                    id="transferee"
                                    placeholder="e.g. Maria Clara"
                                    value={transferee}
                                    onChange={(e) => setTransferee(e.target.value)}
                                    className="bg-gray-50/50 focus:bg-white shadow-sm h-11 uppercase"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="transactionType" className="text-sm font-medium text-gray-700">Transaction Type</Label>
                                <Select value={transactionType} onValueChange={setTransactionType}>
                                    <SelectTrigger id="transactionType" className="bg-gray-50/50 focus:bg-white shadow-sm h-11 w-full">
                                        <SelectValue placeholder="Select Type of Transfer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Sale">Sale</SelectItem>
                                        <SelectItem value="Donation">Donation</SelectItem>
                                        <SelectItem value="Extrajudicial Settlement">Extrajudicial Settlement</SelectItem>
                                        <SelectItem value="Partition">Partition</SelectItem>
                                        <SelectItem value="Waiver of Rights">Waiver of Rights</SelectItem>
                                        <SelectItem value="Assignment">Assignment</SelectItem>

                                    </SelectContent>
                                </Select>
                            </div>

                            {transactionType === "Sale" && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <Label htmlFor="considerationValue" className="text-sm font-medium text-gray-700">Consideration Value (₱)</Label>
                                    <Input
                                        id="considerationValue"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="e.g. 1500000.00"
                                        value={considerationValue}
                                        onChange={(e) => setConsiderationValue(e.target.value)}
                                        className="bg-gray-50/50 focus:bg-white shadow-sm h-11 font-mono text-lg"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="px-6 py-5 border-t bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto text-gray-600 hover:text-gray-900 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous Step
                    </Button>
                    <p className="text-xs text-gray-500 font-bold hidden sm:block">
                        Step 3 of 4 • Transaction Details
                    </p>
                    <Button
                        size="lg"
                        onClick={handleNext}
                        disabled={!transferee || !transferor || !transactionType || (transactionType === "Sale" && !considerationValue)}
                        className="w-full sm:w-auto font-bold shadow-sm transition-all bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Calculator className="w-4 h-4 mr-2" />
                        Proceed to Computation
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
