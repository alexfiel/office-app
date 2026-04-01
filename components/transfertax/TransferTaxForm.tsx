"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/ui/field"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import QRCode from "react-qr-code"
import { useSession } from "next-auth/react"

const UploadForm = dynamic(() => import("../uploadForm.tsx/page"), { ssr: false })

type RealPropertyInfo = {
    id: string;
    taxdecnumber: string;
    pin: string;
    owner: string;
    location: string;
    lotNumber: string;
    area: number;
    marketValue: string | number;
    tctOct: string;
}

export default function TransferTaxForm({ onPreview }: { onPreview?: (data: any) => void }) {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState("documents")

    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    // State for all tabs
    const [documentInfo, setDocumentInfo] = useState({
        type: "",
        docNo: "",
        pageNo: "",
        bookNo: "",
        notarizedBy: "",
        date: ""
    })
    const [documents, setDocuments] = useState<File[]>([])

    const [transactionType, setTransactionType] = useState<string>("")
    const [consideration, setConsideration] = useState<number | "">("")

    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [searchResults, setSearchResults] = useState<RealPropertyInfo[]>([])
    const [isLoading, setIsLoading] = useState(false)
    
    // Pagination state
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const [cart, setCart] = useState<RealPropertyInfo[]>([])
    const [parties, setParties] = useState({ prevOwner: "", newOwner: "" })
    const [isSuccess, setIsSuccess] = useState(false)
    const [savedTxId, setSavedTxId] = useState<string | null>(null)

    // Portion Modal States
    const [isPortionModalOpen, setIsPortionModalOpen] = useState(false)
    const [selectedPropertyForCart, setSelectedPropertyForCart] = useState<RealPropertyInfo | null>(null)
    const [transferMode, setTransferMode] = useState<"whole" | "portion">("whole")
    const [portionArea, setPortionArea] = useState<number | "">("")
    const [portionLotNumber, setPortionLotNumber] = useState("")
    const [portionTaxDec, setPortionTaxDec] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setDocuments(Array.from(e.target.files))
        }
    }

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setPage(1) // Reset to page 1 on new search
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchProperties = async (currentPage: number, search: string) => {
        if (!search && searchResults.length === 0) return

        setIsLoading(true)
        try {
            const queryParam = search ? `&query=${encodeURIComponent(search)}` : ''
            const res = await fetch(`/api/realproperty?page=${currentPage}&limit=${limit}${queryParam}`)
            
            if (!res.ok) throw new Error("Failed to search")
            
            const result = await res.json()
            setSearchResults(result.data)
            setTotal(result.pagination.total)
            setTotalPages(result.pagination.totalPages)

            if (search && result.data.length === 0) {
                toast.error("No properties found.")
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to search")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (debouncedSearch) {
            fetchProperties(page, debouncedSearch)
        }
    }, [page, debouncedSearch, limit])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        fetchProperties(1, searchTerm)
    }

    const addToCart = (property: RealPropertyInfo) => {
        if (cart.find(item => item.id === property.id)) {
            toast.warning("Whole property is already in the cart")
            return
        }
        
        setSelectedPropertyForCart(property)
        setTransferMode("whole")
        setPortionArea("")
        setPortionLotNumber("")
        setPortionTaxDec(`${property.taxdecnumber}-PORTION`)
        setIsPortionModalOpen(true)
    }

    const confirmAddToCart = () => {
        if (!selectedPropertyForCart) return;

        let propertyToAdd = { ...selectedPropertyForCart };

        if (transferMode === "whole") {
            if (cart.find(item => item.id.startsWith(`${propertyToAdd.id}-portion`))) {
                toast.error("Cannot add whole property when portions are already in the cart.");
                return;
            }
        }

        if (transferMode === "portion") {
            const parsedArea = Number(portionArea);
            if (!parsedArea || parsedArea <= 0 || parsedArea > propertyToAdd.area) {
                toast.error("Invalid portion area. It must be greater than 0 and less than or equal to the total area.");
                return;
            }
            if (!portionLotNumber.trim() || !portionTaxDec.trim()) {
                toast.error("Please provide a new lot number and tax declaration number for the portion.");
                return;
            }

            const uniqueId = `${propertyToAdd.id}-portion-${portionLotNumber}`;
            if (cart.find(item => item.id === uniqueId || item.lotNumber === portionLotNumber)) {
                toast.error("A portion with this lot number is already in the cart.");
                return;
            }

            const originalMarketValue = typeof propertyToAdd.marketValue === 'string' 
                ? parseFloat(propertyToAdd.marketValue) 
                : propertyToAdd.marketValue;
            
            const newMarketValue = (originalMarketValue / propertyToAdd.area) * parsedArea;

            propertyToAdd = {
                ...propertyToAdd,
                id: uniqueId, // Unique ID for the portion
                area: parsedArea,
                marketValue: newMarketValue,
                lotNumber: portionLotNumber,
                taxdecnumber: portionTaxDec,
            };
        }

        setCart([...cart, propertyToAdd]);

        if (cart.length === 0) {
            setParties(prev => ({ ...prev, prevOwner: propertyToAdd.owner }));
        }

        setIsPortionModalOpen(false);
        setSelectedPropertyForCart(null);
        toast.success("Added property to cart");
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const totalMarketValue = cart.reduce((total, item) => {
        const val = typeof item.marketValue === 'string' ? parseFloat(item.marketValue) : item.marketValue
        return total + (isNaN(val) ? 0 : val)
    }, 0)

    // Computation Variables
    const taxBase = transactionType === "Deed of Sale"
        ? Math.max(totalMarketValue, Number(consideration || 0))
        : totalMarketValue

    // Compute Tax Due with a 500 Minimum (3/4 of 1%
    const calculatedTax = taxBase * 0.0075;
    const taxDue = Math.max(calculatedTax, 500);

    // Calculate days from notarial date
    let daysFromNotarial = 0
    let surcharge = 0
    let interest = 0
    let validityDate = ""

    if (documentInfo.date) {
        const notarialDate = new Date(documentInfo.date)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - notarialDate.getTime())
        daysFromNotarial = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // Default validity to the 60th day from notarial
        let validityDateDate = new Date(notarialDate); // Assuming you have the start date
        validityDateDate.setDate(validityDateDate.getDate() + 60);
        validityDate = validityDateDate.toLocaleDateString();

        if (daysFromNotarial > 60) {
            surcharge = taxDue * 0.25;
        }

        // INTEREST LOGIC: KICKS IN AFTER 90 DAYS
        if (daysFromNotarial > 90) {

            // Calculate months late (every 30 days past the 60-day grace period)
            const monthsLate = Math.ceil((daysFromNotarial - 90) / 30);

            // Calculate raw interest (2% per month)
            let rawInterest = taxDue * 0.02 * monthsLate;

            // Apply the 72% maximum ceiling
            const maxInterest = taxDue * 0.72;

            interest = Math.min(rawInterest, maxInterest);
        }

        // Validity is until the end of the current 30-day penalty cycle
        if (daysFromNotarial > 90) {
            const maxinterest = taxDue * 0.72;
            if ((taxDue * 0.02 * Math.ceil((daysFromNotarial - 90) / 30)) >= maxinterest) {
                validityDate = "Maximum Interest Reached"
            } else {
                // Next 2% jump happens every 30 days after the 90th day
                const daysIntoCycle = (daysFromNotarial - 90) % 30;
                const daysToNext = daysIntoCycle === 0 ? 0 : 30 - daysIntoCycle;

                const vDate = new Date();
                vDate.setDate(vDate.getDate() + daysToNext);
                validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();

            }
        } else if (daysFromNotarial > 60) {
            // if between 61 and 90 days, validity is the 90th day (before insterest starts)
            const vDate = new Date(notarialDate);
            vDate.setDate(vDate.getDate() + 90);
            validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
        } else {
            // default validity is the 60th day (before surcharge starts)
            const vDate = new Date(notarialDate);
            vDate.setDate(vDate.getDate() + 60);
            validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
        }

    }

    const totalAmountDue = taxDue + surcharge + interest;

    // ---------------- BEGIN OF HANDLE SUBMIT ---------------

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const combinedDocNumber = `Doc: ${documentInfo.docNo}, Page: ${documentInfo.pageNo}, Book: ${documentInfo.bookNo}`;

            const safeValidityDate = validityDate || "60 Days from notarial"
            // Helper to ensure we never send NaN to the API
            const safeNum = (val: any) => {
                const parsed = parseFloat(val);
                return isNaN(parsed) ? 0 : parsed;
            };

            const payload = {
                documentInfo: {
                    type: documentInfo.type || "N/A",
                    name: documentInfo.type || "N/A",
                    number: combinedDocNumber,
                    date: new Date(documentInfo.date || new Date()).toISOString(),
                    notarizedBy: documentInfo.notarizedBy || "N/A",
                    document_url: uploadedUrl || "",
                },
                transferTaxInfo: {
                    // Mapping your 'parties' state to what Zod expects
                    transferee: parties.newOwner || "N/A",
                    transferor: parties.prevOwner || "N/A",
                    transactionType: transactionType || "Not Specified",

                    // Financials with NaN protection
                    considerationValue: safeNum(consideration),
                    totalMarketValue: safeNum(totalMarketValue),
                    taxBase: safeNum(taxBase),
                    taxDue: safeNum(taxDue),
                    surcharge: safeNum(surcharge),
                    interest: safeNum(interest),
                    totalAmountDue: safeNum(totalAmountDue),

                    // These fields were required by your Zod schema but missing in the UI
                    paymentStatus: "Pending",
                    transactionDate: new Date().toISOString(),
                    validUntil: safeValidityDate,
                },
                transferTaxDetails: cart.map(item => ({
                    id: item.id.replace(/-portion.*/, ""),
                    taxdecnumber: item.taxdecnumber,
                    lotNumber: item.lotNumber,
                    owner: item.owner,
                    marketValue: safeNum(item.marketValue),
                    area: item.area.toString(),
                }))
            };

            const res = await fetch("/api/transfertax", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                // Determine if there are specific backend validation details
                console.error("Backend Error payload:", data);
                throw new Error(data.error || "Failed to save transaction");
            }

            toast.success("Transaction saved successfully!");

            // Show success state to allow printing
            setIsSuccess(true);
            setSavedTxId(data.result?.id || null);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setIsSuccess(false);
        setSavedTxId(null);
        setCart([]);
        setParties({ prevOwner: "", newOwner: "" });
        setTransactionType("");
        setConsideration("");
        setDocumentInfo({ type: "", docNo: "", pageNo: "", bookNo: "", notarizedBy: "", date: "" });
        setUploadedUrl(null);
        setActiveTab("documents");
    };


    const handlePreview = () => {
        if (onPreview) {
            onPreview({
                transferee: parties.newOwner || "JUAN DELA CRUZ",
                transferor: parties.prevOwner || "JUAN DELA CRUZ",
                computationDate: new Date().toLocaleDateString(),
                validityDate: validityDate || new Date().toLocaleDateString(),
                transactionId: savedTxId || "PREVIEW",
                qrValue: `ID: ${savedTxId || "PREVIEW"}\nTransferee: ${parties.newOwner || "JUAN DELA CRUZ"}\nAmount Due: P ${totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nValidity Date: ${validityDate || new Date().toLocaleDateString()}`,
                properties: cart.map(p => ({
                    tdNo: p.taxdecnumber,
                    lotNo: p.lotNumber,
                    marketValue: p.marketValue
                })),
                totalMarketValue,
                documentInfo: {
                    type: documentInfo.type || "Deed of Absolute Sale",
                    docNo: documentInfo.docNo || "123456789",
                    pageNo: documentInfo.pageNo || "123456789",
                    bookNo: documentInfo.bookNo || "123456789",
                    notarizedBy: documentInfo.notarizedBy || "ATTY. JUAN DE LA CRUZ",
                    date: documentInfo.date || new Date().toLocaleDateString(),
                },
                transactionInfo: {
                    type: transactionType || "DEED OF ABSOLUTE SALE",
                    consideration: transactionType === "Deed of Sale" ? Number(consideration || 0) : 0,
                    daysFromNotarial,
                    validityDate: validityDate || new Date().toLocaleDateString(),
                },
                computation: {
                    taxBase,
                    taxRate: 0.75,
                    basicTaxDue: taxDue,
                    surcharge,
                    interest,
                    totalAmountDue,
                },
                preparedBy: (session?.user as any)?.name || "USER",
                preparedByRole: (session?.user as any)?.role || "ROLE",
            });
        }
    };

    //----------------- END OF HANDLE SUBMIT ------------------
    return (
        <div className="mx-auto max-w-5xl space-y-6 print:space-y-0 print:m-0 print:p-0">
            <h1 className="text-3xl font-bold print:hidden">New Transfer Tax Transaction</h1>

            {/* Portion Transfer Modal */}
            <Dialog open={isPortionModalOpen} onOpenChange={setIsPortionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Property to Computation</DialogTitle>
                        <DialogDescription>
                            Are you transferring the whole property or a portion of it?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPropertyForCart && (
                        <div className="space-y-4 py-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="transferMode" 
                                        value="whole" 
                                        checked={transferMode === "whole"} 
                                        onChange={() => setTransferMode("whole")} 
                                        className="size-4"
                                    />
                                    <span>Whole Property</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="transferMode" 
                                        value="portion" 
                                        checked={transferMode === "portion"} 
                                        onChange={() => setTransferMode("portion")} 
                                        className="size-4"
                                    />
                                    <span>Portion of Land</span>
                                </label>
                            </div>

                            {transferMode === "portion" && (
                                <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                                    <div className="text-sm text-muted-foreground mb-4">
                                        <p>Original Area: <strong>{selectedPropertyForCart.area} sq.m.</strong></p>
                                        <p>Original MV: <strong>P {Number(selectedPropertyForCart.marketValue).toLocaleString()}</strong></p>
                                        <p>Previous Lot No: <strong>{selectedPropertyForCart.lotNumber}</strong></p>
                                    </div>
                                    <Field>
                                        <Label>Area Transferred (sq.m.)</Label>
                                        <Input
                                            type="number"
                                            value={portionArea}
                                            onChange={(e) => setPortionArea(Number(e.target.value))}
                                            placeholder={`Max: ${selectedPropertyForCart.area}`}
                                        />
                                    </Field>
                                    <Field>
                                        <Label>New Lot Number</Label>
                                        <Input
                                            value={portionLotNumber}
                                            onChange={(e) => setPortionLotNumber(e.target.value)}
                                            placeholder="Assign new lot number"
                                        />
                                    </Field>
                                    <Field>
                                        <Label>New Tax Dec Number</Label>
                                        <Input
                                            value={portionTaxDec}
                                            onChange={(e) => setPortionTaxDec(e.target.value)}
                                            placeholder="Assign new TD number"
                                        />
                                    </Field>
                                    
                                    {portionArea && Number(portionArea) > 0 && (
                                        <div className="pt-2 text-sm">
                                            New Computed Market Value: <br />
                                            <strong className="text-primary text-lg">
                                                P {((Number(selectedPropertyForCart.marketValue) / selectedPropertyForCart.area) * Number(portionArea)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPortionModalOpen(false)}>Cancel</Button>
                        <Button onClick={confirmAddToCart}>Confirm & Add to Cart</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full grid-cols-6 gap-2 print:hidden ${isSuccess ? 'hidden' : ''}`}>
                    <TabsTrigger value="documents">1. Documents</TabsTrigger>
                    <TabsTrigger value="transaction" disabled={!(documentInfo.type && documentInfo.date)}>2. Transaction</TabsTrigger>
                    <TabsTrigger value="search" disabled={!(documentInfo.type && documentInfo.date && transactionType)}>3. Search</TabsTrigger>
                    <TabsTrigger value="cart" disabled={!(documentInfo.type && documentInfo.date && transactionType)}>4. Market Value</TabsTrigger>
                    <TabsTrigger value="parties" disabled={!(documentInfo.type && documentInfo.date && transactionType && cart.length > 0)}>5. Parties</TabsTrigger>
                    <TabsTrigger value="summary" disabled={!(documentInfo.type && documentInfo.date && transactionType && cart.length > 0 && parties.prevOwner && parties.newOwner)}>6. Summary</TabsTrigger>
                </TabsList>

                {/* Tab 1: Documents */}
                <TabsContent value="documents">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notarial Documents</CardTitle>
                            <CardDescription>Input document details and upload scanned copies in PDF format.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field>
                                    <Label>Document Type</Label>
                                    <Input
                                        value={documentInfo.type}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, type: e.target.value })}
                                        placeholder="e.g. Deed of Sale, Deed of Donation"
                                    />
                                </Field>
                                <Field>
                                    <Label>Doc No.</Label>
                                    <Input
                                        value={documentInfo.docNo}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, docNo: e.target.value })}
                                        placeholder="Doc No."
                                    />
                                </Field>
                                <Field>
                                    <Label>Page No.</Label>
                                    <Input
                                        value={documentInfo.pageNo}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, pageNo: e.target.value })}
                                        placeholder="Page No."
                                    />
                                </Field>
                                <Field>
                                    <Label>Book No.</Label>
                                    <Input
                                        value={documentInfo.bookNo}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, bookNo: e.target.value })}
                                        placeholder="Book No."
                                    />
                                </Field>
                                <Field>
                                    <Label>Notarized By</Label>
                                    <Input
                                        value={documentInfo.notarizedBy}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, notarizedBy: e.target.value })}
                                        placeholder="Name of Notary Public"
                                    />
                                </Field>
                                <Field>
                                    <Label>Notarial Date</Label>
                                    <Input
                                        type="date"
                                        value={documentInfo.date}
                                        onChange={(e) => setDocumentInfo({ ...documentInfo, date: e.target.value })}
                                    />
                                </Field>
                            </div>

                            <UploadForm onUploadSuccess={(url) => setUploadedUrl(url)} />
                            {/*
                            <Field className="pt-4">
                                <Label>Upload Files (PDF)</Label>
                                <Input
                                    type="file"
                                    multiple
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                            </Field>
                            {documents.length > 0 && (
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                                    {documents.map((file, i) => (
                                        <li key={i}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                                    ))}
                                </ul>
                            )}
                            */}
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={() => setActiveTab("transaction")} disabled={!(documentInfo.type && documentInfo.date)}>Next: Transaction Type</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Tab 2: Transaction Type */}
                <TabsContent value="transaction">
                    <Card>
                        <CardHeader>
                            <CardTitle>Selection of Transaction</CardTitle>
                            <CardDescription>Choose the type of transaction for these properties.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-3">
                                {["Deed of Sale", "Deed of Donation", "Deed of Extrajudicial Settlement"]
                                    .filter(type => transactionType ? type === transactionType : true)
                                    .map((type) => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer border p-4 rounded-md hover:bg-muted/50 transition-colors">
                                        <input
                                            type="radio"
                                            name="transaction"
                                            value={type}
                                            checked={transactionType === type}
                                            onChange={(e) => setTransactionType(e.target.value)}
                                            className="size-4"
                                        />
                                        <span className="font-medium">{type}</span>
                                    </label>
                                ))}
                            </div>
                            {transactionType && (
                                <div className="flex justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setTransactionType("")
                                        setConsideration("")
                                    }} className="text-xs text-muted-foreground underline">
                                        Change Transaction Type
                                    </Button>
                                </div>
                            )}

                            {transactionType === "Deed of Sale" && (
                                <div className="mt-4 p-4 border rounded-md bg-muted/20">
                                    <Field>
                                        <Label>Consideration (Selling Price)</Label>
                                        <Input
                                            type="number"
                                            value={consideration}
                                            onChange={(e) => setConsideration(Number(e.target.value))}
                                            placeholder="Enter consideration amount"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            For Deed of Sale, Tax Base is the Total Market Value or Consideration, whichever is higher.
                                        </p>
                                    </Field>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setActiveTab("documents")}>Back</Button>
                            <Button onClick={() => setActiveTab("search")} disabled={!transactionType}>Next: Search Properties</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Tab 3: Search & Add to Cart */}
                <TabsContent value="search">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Property</CardTitle>
                            <CardDescription>Search for a Tax Declaration, PIN, or Owner to add to the transaction cart.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleSearch} className="flex items-end justify-between gap-4">
                                <div className="flex items-end gap-2 flex-1">
                                    <Field className="flex-1 max-w-sm">
                                        <Label>Tax Dec Number, PIN, or Owner</Label>
                                        <Input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Enter TD No., PIN, or Owner"
                                        />
                                    </Field>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? "Searching..." : "Search"}
                                    </Button>
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    Total: <span className="text-gray-900 font-bold">{total.toLocaleString()}</span>
                                </div>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="mt-4">
                                    <div className="overflow-x-auto border rounded-xl shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">TD No</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">PIN</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Owner Name</th>
                                                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {searchResults.map((item) => {
                                                    const isAdded = cart.some(c => c.id === item.id);
                                                    return (
                                                    <tr key={item.id} className={`hover:bg-gray-50 ${isAdded ? 'bg-green-50/50 text-muted-foreground' : ''}`}>
                                                        <td className="px-4 py-2 text-sm">{item.taxdecnumber}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{item.pin}</td>
                                                        <td className="px-4 py-2 text-sm text-gray-600">{item.owner}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <Button 
                                                                size="sm" 
                                                                variant={isAdded ? "outline" : "ghost"}
                                                                className={isAdded ? "border-green-200 text-green-700 bg-green-50" : "text-primary hover:text-primary-dark"}
                                                                onClick={() => !isAdded && addToCart(item)}
                                                                disabled={isAdded}
                                                            >
                                                                {isAdded ? "Added ✓" : "Select"}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )})}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>Show</span>
                                            <select 
                                                value={limit} 
                                                onChange={(e) => {
                                                    setLimit(Number(e.target.value));
                                                    setPage(1);
                                                }}
                                                className="border rounded px-1 py-0.5"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                            </select>
                                            <span>per page</span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-gray-600">
                                                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={page === 1 || isLoading}
                                                    onClick={() => setPage(prev => prev - 1)}
                                                    className="bg-white"
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={page === totalPages || isLoading}
                                                    onClick={() => setPage(prev => prev + 1)}
                                                    className="bg-white"
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                            <Button variant="outline" onClick={() => setActiveTab("transaction")}>Back</Button>
                            <Button onClick={() => setActiveTab("cart")} disabled={cart.length === 0}>
                                Next: View Computation
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Tab 4: Cart & Total Market Value */}
                <TabsContent value="cart">
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Cart & Computation</CardTitle>
                            <CardDescription>Review selected properties and their total market value.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {cart.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No properties in the cart.</p>
                            ) : (
                                <div className="overflow-x-auto space-y-4">
                                    <table className="min-w-full border">
                                        <thead>
                                            <tr className="bg-muted">
                                                <th className="border px-4 py-2 text-left">TD No</th>
                                                <th className="border px-4 py-2 text-left">Lot No</th>
                                                <th className="border px-4 py-2 text-left">Area(sqm)</th>
                                                <th className="border px-4 py-2 text-left">Owner</th>
                                                <th className="border px-4 py-2 text-right">Market Value</th>
                                                <th className="border px-4 py-2 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="border px-4 py-2">{item.taxdecnumber}</td>
                                                    <td className="border px-4 py-2">{item.lotNumber}</td>
                                                    <td className="border px-4 py-2">{item.area}</td>
                                                    <td className="border px-4 py-2">{item.owner}</td>
                                                    <td className="border px-4 py-2 text-right">
                                                        P {Number(item.marketValue || 0).toLocaleString()}
                                                    </td>
                                                    <td className="border px-4 py-2 text-center">
                                                        <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>
                                                            Remove
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/50 font-bold">
                                                <td colSpan={3} className="border px-4 py-2 text-right">Total Market Value:</td>
                                                <td className="border px-4 py-2 text-right text-lg text-primary">
                                                    P {totalMarketValue.toLocaleString()}
                                                </td>
                                                <td className="border px-4 py-2"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setActiveTab("search")}>Back</Button>
                            <Button onClick={() => setActiveTab("parties")} disabled={cart.length === 0}>Next: Parties</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Tab 5: Parties */}
                <TabsContent value="parties">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer of Owner</CardTitle>
                            <CardDescription>Enter details of the previous owner and the new owner.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-md">
                            <Field>
                                <Label>Previous Owner</Label>
                                <Input
                                    value={parties.prevOwner}
                                    onChange={(e) => setParties({ ...parties, prevOwner: e.target.value })}
                                    placeholder="Full name of previous owner"
                                />
                            </Field>
                            <Field>
                                <Label>New Owner</Label>
                                <Input
                                    value={parties.newOwner}
                                    onChange={(e) => setParties({ ...parties, newOwner: e.target.value })}
                                    placeholder="Full name of new owner"
                                />
                            </Field>
                            <div className="mt-6 border-t pt-4">
                                <h3 className="text-lg font-bold mb-4">Transfer Tax Computation</h3>

                                <div className="space-y-2 text-sm max-w-lg">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Market Value:</span>
                                        <span>P {totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {transactionType === "Deed of Sale" && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Consideration:</span>
                                            <span>P {Number(consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-medium">
                                        <span>Tax Base:</span>
                                        <span>P {taxBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax Rate:</span>
                                        <span>0.75%</span>
                                    </div>
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>Basic Tax Due:</span>
                                        <span>P {taxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {daysFromNotarial > 60 && (
                                        <div className="pt-2">
                                            <p className="text-xs text-destructive mb-1">
                                                Late payment detected ({daysFromNotarial} days from Notarial Date).
                                            </p>
                                            <div className="flex justify-between text-destructive">
                                                <span>Surcharge (25%):</span>
                                                <span>P {surcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between text-destructive">
                                                <span>Interest (2% / month late):</span>
                                                <span>P {interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between text-lg font-bold pt-4 border-t text-primary mt-2">
                                        <span>Total Amount Due:</span>
                                        <span>P {totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {validityDate && (
                                        <div className="mt-2 text-xs italic text-muted-foreground">
                                            {validityDate === "Maximum Interest Reached" ? (
                                                <span className="font-bold text-destructive">
                                                    MAXIMUM INTEREST CEILING OF 72% HAS BEEN REACHED. NO FURTHER INTEREST WILL BE ADDED.
                                                </span>
                                            ) : (
                                                <span>
                                                    VALIDITY OF THIS COMPUTATION IS UNTIL {validityDate.toUpperCase()} BEFORE ANOTHER 2% INTEREST IS ADDED.
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setActiveTab("cart")}>Back</Button>
                            <Button onClick={() => setActiveTab("summary")} disabled={!parties.prevOwner || !parties.newOwner}>Next: Summary</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Tab 6: Summary */}
                <TabsContent value="summary">
                    <Card className="print:border-none print:shadow-none pb-12">
                        <CardHeader className="print:hidden">
                            <CardTitle>Computation & Summary</CardTitle>
                            <CardDescription>Review all details before submitting.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Hidden in PDF but visible on screen */}
                            {isSuccess && (
                                <div className="mb-4 p-4 border border-green-200 bg-green-50 rounded-md print:hidden">
                                    <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                                        ✅ Transaction submitted successfully! You may now print this summary or start a new transaction.
                                    </p>
                                </div>
                            )}

                            {/* Print Headers only visible during window.print */}
                            <div className="hidden print:block mb-8 border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <h1 className="text-2xl font-bold uppercase tracking-widest">Office of the City Treasurer</h1>
                                        <h2 className="text-xl font-semibold mt-1">TRANSFER TAX COMPUTATION SUMMARY</h2>
                                        <p className="text-sm mt-2">Date Computed: {new Date().toLocaleDateString()}</p>
                                    </div>
                                    {savedTxId && (
                                        <div className="flex flex-col items-center">
                                            <QRCode value={`ID: ${savedTxId}\nNew Owner: ${parties.newOwner}\nAmount Due: P ${totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nValidity Date: ${validityDate || new Date().toLocaleDateString()}`} size={80} level="M" />
                                            <span className="text-[10px] mt-1 text-muted-foreground break-all max-w-[80px] text-center">{savedTxId.slice(-8)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Previous Owner</h3>
                                    <p className="mt-1 font-medium">{parties.prevOwner || "-"}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">New Owner</h3>
                                    <p className="mt-1 font-medium">{parties.newOwner || "-"}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Properties computation</h3>
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted text-muted-foreground">
                                            <th className="px-2 py-1 text-left font-medium">TD No</th>
                                            <th className="px-2 py-1 text-left font-medium">Lot No</th>
                                            <th className="px-2 py-1 text-right font-medium">Market Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="px-2 py-1">{item.taxdecnumber}</td>
                                                <td className="px-2 py-1">{item.lotNumber}</td>
                                                <td className="px-2 py-1 text-right">P {Number(item.marketValue || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="font-bold border-t-2">
                                            <td colSpan={2} className="px-2 py-2 text-right">Total Market Value:</td>
                                            <td className="px-2 py-2 text-right">P {totalMarketValue.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Document Info</h3>
                                    <p className="mt-1 font-medium">{documentInfo.type || "N/A"}</p>
                                    <p className="text-sm text-muted-foreground">Doc No: {documentInfo.docNo || "-"}, Page No: {documentInfo.pageNo || "-"}, Book No: {documentInfo.bookNo || "-"}</p>
                                    <p className="text-sm text-muted-foreground">Notarized By: {documentInfo.notarizedBy || "-"} {documentInfo.date ? `on ${documentInfo.date}` : ""}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{documents.length} file(s) attached</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction Info</h3>
                                    <p className="mt-1 font-medium">{transactionType || "Not specified"}</p>
                                    <p className="text-sm text-muted-foreground">{transactionType === "Deed of Sale" ? "Consideration:" : "Market Value:"} P {Number(consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-muted-foreground">{daysFromNotarial} days from Notarial Date</p>
                                    <p className="text-sm text-muted-foreground">Computation Valid Until:{validityDate}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="mt-4 border-b pb-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transfer Tax Computation</h3>

                                    <div className="space-y-1 text-sm max-w-lg bg-muted/20 p-4 rounded-md border">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Market Value:</span>
                                            <span>P {totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {transactionType === "Deed of Sale" && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Consideration:</span>
                                                <span>P {Number(consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-medium">
                                            <span>Tax Base:</span>
                                            <span>P {taxBase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tax Rate:</span>
                                            <span>0.75%</span>
                                        </div>
                                        <div className="flex justify-between font-bold pt-2 border-t mt-1">
                                            <span>Basic Tax Due:</span>
                                            <span>P {taxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        {daysFromNotarial > 60 && (
                                            <div className="pt-2">
                                                <p className="text-xs text-destructive mb-1 font-medium">
                                                    Late payment ({daysFromNotarial} days from Notarial Date)
                                                </p>
                                                <div className="flex justify-between text-destructive">
                                                    <span>Surcharge (25%):</span>
                                                    <span>P {surcharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between text-destructive">
                                                    <span>Interest (2% / month):</span>
                                                    <span>P {interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-lg font-bold pt-3 border-t text-primary mt-2">
                                            <span>Total Amount Due:</span>
                                            <span>P {totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>

                                        {validityDate && (
                                            <div className="mt-2 text-xs italic text-muted-foreground">
                                                {validityDate === "Maximum Interest Reached" ? (
                                                    <span className="font-bold text-destructive">
                                                        MAXIMUM INTEREST CEILING OF 72% HAS BEEN REACHED. NO FURTHER INTEREST WILL BE ADDED.
                                                    </span>
                                                ) : (
                                                    <span>
                                                        VALIDITY OF THIS COMPUTATION IS UNTIL {validityDate.toUpperCase()} BEFORE ANOTHER 2% INTEREST IS ADDED.
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                    </div>

                                </div>

                                {/* Right Column: Embedded Thumbnail Preview */}
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Attached Document Preview</h4>
                                    {uploadedUrl ? (
                                        <a href={uploadedUrl} target="_blank" rel="noreferrer" className="relative group block w-full max-w-[280px] h-[360px] border rounded-md overflow-hidden shadow-sm transition-transform hover:scale-[1.02] bg-white">
                                            {/* pointer-events-none prevents iframe from capturing the click so the anchor tag works correctly */}
                                            <iframe src={`${uploadedUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full pointer-events-none" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <div className="bg-white/95 text-black px-4 py-2 rounded shadow-sm text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click to Open PDF
                                                </div>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex flex-col items-center justify-center h-[200px] max-w-[280px] border border-dashed rounded-md bg-muted/10">
                                            <span className="italic">No document attached</span>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Print-only Signatures */}
                            <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 break-inside-avoid">
                                <div>
                                    <p className="text-xs mb-8">Prepared by:</p>
                                    <p className="font-bold border-b border-black w-[80%] pb-1 uppercase">{(session?.user as any)?.name || "USER"}</p>
                                    <p className="text-xs mt-1">{(session?.user as any)?.role || "Designation"}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-8">Approved by:</p>
                                    <p className="font-bold border-b border-black w-[80%] pb-1 uppercase"></p>
                                    <p className="text-xs mt-1">City Treasurer / Authorized Personnel</p>
                                </div>
                            </div>

                            {/* Print-only Signatures */}
                            <div className="hidden print:grid grid-cols-2 gap-12 mt-16 pt-8 break-inside-avoid">
                                <div>
                                    <p className="text-xs mb-8">Prepared by:</p>
                                    <p className="font-bold border-b border-black w-[80%] pb-1 uppercase">{(session?.user as any)?.name || "USER"}</p>
                                    <p className="text-xs mt-1">{(session?.user as any)?.role || "Designation"}</p>
                                </div>
                                <div>
                                    <p className="text-xs mb-8">Approved by:</p>
                                    <p className="font-bold border-b border-black w-[80%] pb-1 uppercase"></p>
                                    <p className="text-xs mt-1">City Treasurer / Authorized Personnel</p>
                                </div>
                            </div>

                        </CardContent>
                        {/* Tab 6: Summary Footer */}
                        <CardFooter className="flex justify-between print:hidden">
                            {!isSuccess ? (
                                <>
                                    <Button variant="outline" onClick={() => setActiveTab("parties")}>Back</Button>
                                    <div className="space-x-2">
                                        <Button variant="outline" onClick={handlePreview}>👁️ Preview Invoice</Button>
                                        <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[150px]">
                                            {isLoading ? "Saving..." : "Submit Transaction"}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={handleReset}>Start New Transaction</Button>
                                    <div className="space-x-2">
                                        <Button variant="outline" onClick={handlePreview}>👁️ Preview Invoice</Button>
                                        <Button onClick={handlePreview} className="bg-blue-600 hover:bg-blue-700 min-w-[150px]">🖨️ Print PDF</Button>
                                    </div>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
