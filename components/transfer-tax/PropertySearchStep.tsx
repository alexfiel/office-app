"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Field } from "@/components/ui/field"
import { toast } from "sonner"
import { RealPropertyInfo } from "@/lib/types/property"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"


interface PropertySearchStepProps {
    cart: RealPropertyInfo[];
    onAddToCart: (property: RealPropertyInfo) => void;
    onBack: () => void;
    onNext: () => void;
}

export function PropertySearchStep({ cart, onAddToCart, onBack, onNext }: PropertySearchStepProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [searchResults, setSearchResults] = useState<RealPropertyInfo[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Pagination State
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    const fetchProperties = useCallback(async (query: string, currentPage: number, currentLimit: number) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true)
        try {
            const queryParam = encodeURIComponent(query)
            const res = await fetch(`/api/realproperty?page=${currentPage}&limit=${currentLimit}&query=${queryParam}`)

            if (!res.ok) throw new Error("FETCH ERROR")

            const result = await res.json()
            setSearchResults(result.data)
            setTotal(result.pagination.total)
            setTotalPages(result.pagination.totalPages)
        } catch (error) {
            toast.error("FAILED TO FETCH PROPERTIES.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    // 1. DEBOUNCE EFFECT: Wait 500ms after typing stops before searching
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                setPage(1) // Reset to first page on new search
                fetchProperties(searchTerm, 1, limit)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm, limit, fetchProperties])

    // 2. PAGINATION EFFECT: Triggered when page changes
    useEffect(() => {
        if (searchTerm) {
            fetchProperties(searchTerm, page, limit)
        }
    }, [page, fetchProperties])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-small-caps">SEARCH PROPERTY</CardTitle>
                <CardDescription>
                    RESULTS ARE DEBOUNCED. TYPING WILL AUTOMATICALLY TRIGGER THE SEARCH.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="flex flex-col md:flex-row items-end gap-4 bg-muted/30 p-4 rounded-lg border">
                    <Field className="flex-1">
                        <Label className="text-[10px] font-bold">SEARCH CRITERIA (AUTO-DEBOUNCE)</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="TYPE TD NO., PIN, OR OWNER NAME..."
                                className="uppercase pl-10"
                            />
                        </div>
                    </Field>

                    <Field className="w-full md:w-32">
                        <Label className="text-[10px] font-bold">LIMIT</Label>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value))
                                setPage(1)
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value={10}>10 PER PAGE</option>
                            <option value={20}>20 PER PAGE</option>
                            <option value={50}>50 PER PAGE</option>
                        </select>
                    </Field>
                </div>

                {/* Results Table */}
                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center font-bold font-small-caps">
                            Loading Results...
                        </div>
                    )}

                    {searchResults.length > 0 ? (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="overflow-x-auto border rounded-xl shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 font-small-caps text-[11px]">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold uppercase">TD Number</th>
                                            <th className="px-4 py-3 text-left font-bold uppercase">Lot No.</th>
                                            <th className="px-4 py-3 text-left font-bold uppercase">Owner Name</th>
                                            <th className="px-4 py-3 text-left font-bold uppercase">Area(sqm)</th>
                                            <th className="px-4 py-3 text-left font-bold uppercase">Market Value</th>
                                            <th className="px-4 py-3 text-right font-bold uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {searchResults.map((item) => {
                                            const isAdded = cart.some((c) => c.id === item.id);
                                            return (
                                                <tr key={item.id} className={`hover:bg-gray-50 ${isAdded ? 'bg-green-50/50' : ''}`}>
                                                    <td className="px-4 py-3 text-sm">{item.taxdecnumber}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.lotNumber}</td>
                                                    <td className="px-4 py-3 text-sm uppercase font-medium">{item.owner}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.area}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.marketValue}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant={isAdded ? "outline" : "default"}
                                                            className={isAdded ? "text-green-700 bg-green-50 border-green-200" : "font-bold"}
                                                            onClick={() => !isAdded && onAddToCart(item)}
                                                            disabled={isAdded}
                                                        >
                                                            {isAdded ? "✓ ADDED" : "SELECT"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border">
                                <div className="text-xs font-bold uppercase text-muted-foreground">
                                    Total: {total.toLocaleString()} Records
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs font-bold">
                                        PAGE {page} OF {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || isLoading}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : !isLoading && searchTerm && (
                        <div className="text-center py-10 border border-dashed rounded-lg text-muted-foreground font-small-caps">
                            No matching records found for "{searchTerm}"
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline" onClick={onBack} className="font-bold">BACK</Button>
                <Button onClick={onNext} disabled={cart.length === 0} className="min-w-[180px] font-bold">
                    NEXT: REVIEW CART ({cart.length})
                </Button>
            </CardFooter>
        </Card>
    )
}