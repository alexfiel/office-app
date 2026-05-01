"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/ui/field"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import QRCode from "react-qr-code"
import { useSession } from "next-auth/react"
import { useHasMounted } from "@/hooks/use-has-mounted"

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

export default function EditTransferTaxForm({ initialData, onPreview }: { initialData: any, onPreview?: (data: any) => void }) {
    const router = useRouter();
    const { data: session } = useSession();
    const hasMounted = useHasMounted()
    const [activeTab, setActiveTab] = useState("documents")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Parse initial document numbers
    const parsedDocNo = initialData?.notarialDocument?.documentNumber?.split(",")[0]?.replace("Doc: ", "") || ""
    const parsedPageNo = initialData?.notarialDocument?.documentNumber?.split(",")[1]?.replace(" Page: ", "") || ""
    const parsedBookNo = initialData?.notarialDocument?.documentNumber?.split(",")[2]?.replace(" Book: ", "") || ""

    const [uploadedUrl, setUploadedUrl] = useState<string | null>(initialData?.notarialDocument?.document_url || null);

    const [documentInfo, setDocumentInfo] = useState({
        type: initialData?.notarialDocument?.documentType || "",
        docNo: parsedDocNo,
        pageNo: parsedPageNo,
        bookNo: parsedBookNo,
        notarizedBy: initialData?.notarialDocument?.notarizedBy || "",
        date: initialData?.notarialDocument?.notarialDate ? new Date(initialData.notarialDocument.notarialDate).toISOString().split('T')[0] : ""
    })

    const [transactionType, setTransactionType] = useState<string>(initialData?.transactionType || "")
    const [consideration, setConsideration] = useState<number | "">(initialData?.considerationvalue ? Number(initialData.considerationvalue) : "")

    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState<RealPropertyInfo[]>([])

    // Map existing details back to 'cart' shape using the attached realProperty
    const initialCart = initialData?.details ? initialData.details.map((d: any) => ({
        id: d.realPropertyId,
        taxdecnumber: d.taxdecnumber,
        pin: d.realProperty?.pin || "N/A",
        owner: d.owner,
        location: d.realProperty?.location || "N/A",
        lotNumber: d.lotNumber,
        area: Number(d.area),
        marketValue: Number(d.marketValue),
        tctOct: d.realProperty?.tctOct || "N/A"
    })) : [];

    const [cart, setCart] = useState<RealPropertyInfo[]>(initialCart)
    const [parties, setParties] = useState({ prevOwner: initialData?.transferor || "", newOwner: initialData?.transferee || "" })

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm) return

        setIsLoading(true)
        try {
            const queryParam = `?query=${encodeURIComponent(searchTerm)}`
            const res = await fetch(`/api/realproperty${queryParam}`)
            if (!res.ok) throw new Error("Failed to search")
            const data: RealPropertyInfo[] = await res.json()
            setSearchResults(data)
            if (data.length === 0) {
                toast.error("No properties found.")
            } else {
                toast.success(`Found ${data.length} properties.`)
            }
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to search")
        } finally {
            setIsLoading(false)
        }
    }

    const addToCart = (property: RealPropertyInfo) => {
        if (cart.find(item => item.id === property.id)) {
            toast.warning("Property is already in the cart")
            return
        }
        setCart([...cart, property])

        if (cart.length === 0) {
            setParties(prev => ({ ...prev, prevOwner: property.owner }))
        }

        toast.success("Added property to cart")
    }

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
        let validityDateDate = new Date(notarialDate);
        validityDateDate.setDate(validityDateDate.getDate() + 60);
        validityDate = validityDateDate.toLocaleDateString();

        if (daysFromNotarial > 60) {
            surcharge = taxDue * 0.25;
        }

        if (daysFromNotarial > 90) {
            const monthsLate = Math.ceil((daysFromNotarial - 90) / 30);
            let rawInterest = taxDue * 0.02 * monthsLate;
            const maxInterest = taxDue * 0.72;
            interest = Math.min(rawInterest, maxInterest);
        }

        if (daysFromNotarial > 90) {
            const maxinterest = taxDue * 0.72;
            if ((taxDue * 0.02 * Math.ceil((daysFromNotarial - 90) / 30)) >= maxinterest) {
                validityDate = "Maximum Interest Reached"
            } else {
                const daysIntoCycle = (daysFromNotarial - 90) % 30;
                const daysToNext = daysIntoCycle === 0 ? 0 : 30 - daysIntoCycle;
                const vDate = new Date();
                vDate.setDate(vDate.getDate() + daysToNext);
                validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
            }
        } else if (daysFromNotarial > 60) {
            const vDate = new Date(notarialDate);
            vDate.setDate(vDate.getDate() + 90);
            validityDate = vDate.toLocaleDateString('EN-US').toUpperCase();
        } else {
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
                    transferee: parties.newOwner || "N/A",
                    transferor: parties.prevOwner || "N/A",
                    transactionType: transactionType || "Not Specified",
                    considerationValue: safeNum(consideration),
                    totalMarketValue: safeNum(totalMarketValue),
                    taxBase: safeNum(taxBase),
                    taxDue: safeNum(taxDue),
                    surcharge: safeNum(surcharge),
                    interest: safeNum(interest),
                    totalAmountDue: safeNum(totalAmountDue),
                    paymentStatus: initialData?.paymentstatus || "PENDING",
                    transactionDate: initialData?.transactionDate || new Date().toISOString(),
                    validUntil: safeValidityDate,
                    dayselapsed: safeNum(daysFromNotarial),
                },
                transferTaxDetails: cart.map(item => ({
                    id: item.id,
                    taxdecnumber: item.taxdecnumber,
                    lotNumber: item.lotNumber,
                    owner: item.owner,
                    marketValue: safeNum(item.marketValue),
                    area: item.area.toString(),
                }))
            };

            const res = await fetch(`/api/transfertax/${initialData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Validation Error:", data.errors);
                throw new Error(data.error || "Failed to update transaction");
            }

            toast.success("Transaction updated successfully!");
            setIsSuccess(true);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreview = () => {
        if (onPreview) {
            onPreview({
                transferee: parties.newOwner || "JUAN DELA CRUZ",
                transferor: parties.prevOwner || "JUAN DELA CRUZ",
                computationDate: new Date().toLocaleDateString(),
                validityDate: validityDate || new Date().toLocaleDateString(),
                transactionId: initialData.id || "PREVIEW",
                qrValue: `ID: ${initialData.id || "PREVIEW"}\nTransferee: ${parties.newOwner || "JUAN DELA CRUZ"}\nAmount Due: P ${totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nValidity Date: ${validityDate || new Date().toLocaleDateString()}`,
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
                    dayselapsed: daysFromNotarial,
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
                preparedByDesignation: (session?.user as any)?.designation || "DESIGNATION",
            });
        }
    };

    //----------------- END OF HANDLE SUBMIT ------------------
    return (
        <div className="mx-auto max-w-5xl space-y-6 print:space-y-0 print:m-0 print:p-0">
            <h1 className="text-3xl font-bold print:hidden">Edit Transfer Tax Transaction</h1>

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
                            {uploadedUrl && (
                                <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-md">
                                    <p className="text-sm font-medium text-green-800">Currently attached file: <a href={uploadedUrl} target="_blank" className="underline font-bold" rel="noreferrer">View PDF</a></p>
                                </div>
                            )}
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
                            <CardDescription>Search for a Tax Declaration or PIN to add to the transaction cart.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleSearch} className="flex items-end gap-2">
                                <Field className="flex-1 max-w-sm">
                                    <Label>Tax Dec Number or PIN</Label>
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Enter TD No. or PIN"
                                    />
                                </Field>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Searching..." : "Search"}
                                </Button>
                            </form>

                            {searchResults.length > 0 && (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full border">
                                        <thead>
                                            <tr className="bg-muted">
                                                <th className="border px-4 py-2 text-left">ID</th>
                                                <th className="border px-4 py-2 text-left">TD No</th>
                                                <th className="border px-4 py-2 text-left">PIN</th>
                                                <th className="border px-4 py-2 text-left">Owner Name</th>
                                                <th className="border px-4 py-2 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchResults.map((item) => {
                                                const isAdded = cart.some(c => c.id === item.id);
                                                return (
                                                <tr key={item.id} className={isAdded ? "bg-green-50/50 text-muted-foreground" : ""}>
                                                    <td className="border px-4 py-2">{item.id}</td>
                                                    <td className="border px-4 py-2">{item.taxdecnumber}</td>
                                                    <td className="border px-4 py-2">{item.pin}</td>
                                                    <td className="border px-4 py-2">{item.owner}</td>
                                                    <td className="border px-4 py-2 text-center">
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => !isAdded && addToCart(item)}
                                                            disabled={isAdded}
                                                            variant={isAdded ? "outline" : "default"}
                                                            className={isAdded ? "border-green-200 text-green-700 bg-green-50" : ""}
                                                        >
                                                            {isAdded ? "Added ✓" : "Select"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setActiveTab("transaction")}>Back</Button>
                            <Button onClick={() => setActiveTab("cart")}>Next: View Cart</Button>
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
                                />
                            </Field>
                            <Field>
                                <Label>New Owner</Label>
                                <Input
                                    value={parties.newOwner}
                                    onChange={(e) => setParties({ ...parties, newOwner: e.target.value })}
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
                                    <div className="flex justify-between font-bold pt-2 border-t">
                                        <span>Basic Tax Due:</span>
                                        <span>P {taxDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>

                                    {daysFromNotarial > 60 && (
                                        <div className="pt-2">
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
                <TabsContent value="summary" className="print:m-0 print:p-0">
                    <Card className="print:border-none print:shadow-none pb-12">
                        <CardHeader className="print:hidden">
                            <CardTitle>Computation & Summary</CardTitle>
                            <CardDescription>Review all details before saving changes.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Hidden in PDF but visible on screen */}
                            {isSuccess && (
                                <div className="mb-4 p-4 border border-green-200 bg-green-50 rounded-md print:hidden">
                                    <p className="text-sm font-bold text-green-800 flex items-center gap-2">
                                        ✅ Transaction updated successfully! You may now print this summary or return to the list.
                                    </p>
                                </div>
                            )}

                            {/* Print Headers only visible during window.print */}
                            <div className="hidden print:block mb-8 border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="text-left">
                                        <h1 className="text-2xl font-bold uppercase tracking-widest">Office of the City Treasurer</h1>
                                        <h2 className="text-xl font-semibold mt-1">TRANSFER TAX COMPUTATION SUMMARY</h2>
                                        <p className="text-sm mt-2" suppressHydrationWarning>Date Computed: {hasMounted ? new Date().toLocaleDateString() : ""}</p>
                                    </div>
                                    {initialData.id && (
                                        <div className="flex flex-col items-center">
                                            {hasMounted && (
                                                <QRCode value={`ID: ${initialData.id}\nNew Owner: ${parties.newOwner}\nAmount Due: P ${totalAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} size={80} level="M" />
                                            )}
                                            <span className="text-[10px] mt-1 text-muted-foreground break-all max-w-[80px] text-center">{initialData.id.slice(-8)}</span>
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
                                            <td className="px-2 py-2 text-right">Total Market Value:</td>
                                            <td className="px-2 py-2 text-right">P {totalMarketValue.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-b pb-4 mt-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Document Info</h3>
                                    <p className="mt-1 font-medium">{documentInfo.type || "N/A"}</p>
                                    <p className="text-sm text-muted-foreground">Doc No: {documentInfo.docNo || "-"}, Page No: {documentInfo.pageNo || "-"}, Book No: {documentInfo.bookNo || "-"}</p>
                                    <p className="text-sm text-muted-foreground">Notarized By: {documentInfo.notarizedBy || "-"} {documentInfo.date ? `on ${documentInfo.date}` : ""}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{uploadedUrl ? "1" : "0"} file(s) attached</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction Info</h3>
                                    <p className="mt-1 font-medium">{transactionType || "Not specified"}</p>
                                    <p className="text-sm text-muted-foreground">{transactionType === "Deed of Sale" ? "Consideration:" : "Market Value:"} P {Number(consideration || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p className="text-sm text-muted-foreground">{daysFromNotarial} days from Notarial Date</p>
                                    <p className="text-sm text-muted-foreground">Computation Valid Until: {validityDate}</p>
                                </div>
                            </div>

                            <div className="mt-4 border-b pb-4">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Transfer Tax Computation & Documents</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Computation */}
                                    <div className="space-y-1 text-sm bg-muted/20 p-4 rounded-md border h-fit">
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
                        <CardFooter className="flex justify-between print:hidden">
                            {!isSuccess ? (
                                <>
                                    <Button variant="outline" onClick={() => setActiveTab("parties")}>Back</Button>
                                    <div className="space-x-2">
                                        <Button variant="outline" onClick={handlePreview}>👁️ Preview Invoice</Button>
                                        <Button onClick={handleSubmit} disabled={isLoading} className="min-w-[150px]">
                                            {isLoading ? "Updating..." : "Update Transaction"}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => router.push("/viewTransferTaxList")}>Back to List</Button>
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
