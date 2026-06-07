"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, ArrowLeft, Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RealPropertyInfo } from "@/lib/types/property";

export function SearchProperty() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [searchResults, setSearchResults] = useState<RealPropertyInfo[]>([]);
    const [cart, setCart] = useState<RealPropertyInfo[]>([]);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchProperties = useCallback(async (query: string, currentPage: number, currentLimit: number) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const queryParam = encodeURIComponent(query);
            const res = await fetch(`/api/realproperty?page=${currentPage}&limit=${currentLimit}&query=${queryParam}`);

            if (!res.ok) throw new Error("FETCH ERROR");

            const result = await res.json();
            setSearchResults(result.data);
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.totalPages);
            setHasSearched(true);
        } catch {
            toast.error("FAILED TO FETCH PROPERTIES.");
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                setPage(1);
                fetchProperties(searchQuery, 1, limit);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, limit, fetchProperties]);

    useEffect(() => {
        if (searchQuery) {
            fetchProperties(searchQuery, page, limit);
        }
    }, [page, limit, fetchProperties, searchQuery]);

    // Initialize cart from cookie
    useEffect(() => {
        try {
            const match = document.cookie.match(new RegExp('(^| )rpt-cart=([^;]+)'));
            if (match) {
                const storedCart = JSON.parse(decodeURIComponent(match[2]));
                if (Array.isArray(storedCart) && storedCart.length > 0) {
                    setCart(storedCart);
                }
            }
        } catch (e) {
            console.error("Failed to parse cart cookie", e);
        }
    }, []);

    const saveCartToCookies = (newCart: RealPropertyInfo[]) => {
        document.cookie = `rpt-cart=${encodeURIComponent(JSON.stringify(newCart))}; path=/`;
    };

    const addToCart = (property: RealPropertyInfo) => {
        if (cart.some(p => p.id === property.id)) {
            toast.info("Property is already in the cart.");
            return;
        }
        const newCart = [...cart, property];
        setCart(newCart);
        saveCartToCookies(newCart);
        toast.success(`Added ${property.taxdecnumber} to cart`);
    };

    const removeFromCart = (propertyId: string) => {
        const newCart = cart.filter(p => p.id !== propertyId);
        setCart(newCart);
        saveCartToCookies(newCart);
        toast.info("Removed property from cart");
    };

    const handleNext = () => {
        if (cart.length === 0) return;
        
        console.log("Proceeding to Step 3 with properties:", cart);
        router.push("/newTransferTax/transaction");
    };

    const handleBack = () => {
        router.push("/newTransferTax");
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <Card className="border-2 shadow-lg rounded-2xl overflow-hidden bg-white mb-8">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 pt-8 pb-6 px-6 border-b">
                    <CardHeader className="text-center space-y-4 p-0">
                        <div className="mx-auto bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                            <Search className="w-8 h-8 text-emerald-600" />
                        </div>
                        <div className="space-y-1.5">
                            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                                Search Subject Properties
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500 max-w-md mx-auto">
                                Locate properties subject to the transfer tax by Owner Name, Tax Dec, or Title No.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </div>

                <CardContent className="p-6 sm:p-10 space-y-8">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                placeholder="Enter Owner Name, Tax Dec, or Title No..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-14 bg-gray-50/80 focus:bg-white text-base shadow-sm rounded-xl border-gray-200"
                            />
                        </div>
                    </div>

                    {/* Results Section */}
                    {hasSearched && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Matching Results</h3>
                                {isSearching && <span className="text-xs text-emerald-600 font-semibold animate-pulse">Searching...</span>}
                            </div>
                            
                            {searchResults.length > 0 ? (
                                <div className="grid gap-4">
                                    {searchResults.map((property) => {
                                        const isAdded = cart.some(p => p.id === property.id);
                                        return (
                                            <div 
                                                key={property.id}
                                                className={`p-5 rounded-xl border-2 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                                    isAdded 
                                                        ? "border-emerald-200 bg-emerald-50/30" 
                                                        : "border-gray-100 hover:border-emerald-200 hover:bg-gray-50/80"
                                                }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3.5 rounded-xl bg-gray-100 text-gray-500">
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 text-lg sm:text-xl leading-tight mb-1">{property.owner}</h4>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                                                            <div className="flex items-center">
                                                                <span className="font-semibold text-gray-500 mr-2">Tax Dec:</span> 
                                                                <span className="font-medium text-gray-900">{property.taxdecnumber}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="font-semibold text-gray-500 mr-2">PIN:</span> 
                                                                <span className="font-medium text-gray-900">{property.pin}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <span className="font-semibold text-gray-500 mr-2">Area:</span> 
                                                                <span className="font-medium text-gray-900">{property.area} sq.m.</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => addToCart(property)}
                                                    disabled={isAdded}
                                                    variant={isAdded ? "outline" : "default"}
                                                    className={`w-full sm:w-auto shrink-0 font-semibold ${isAdded ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                                >
                                                    {isAdded ? "Added to Cart" : <><Plus className="w-4 h-4 mr-2" /> Add Property</>}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                    
                                    {/* Pagination (Simple) */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-between items-center mt-4 p-4 border rounded-xl bg-gray-50">
                                            <span className="text-sm font-semibold text-gray-500">Total: {total} records</span>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                                                <span className="text-sm font-bold flex items-center px-2">Page {page} of {totalPages}</span>
                                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                !isSearching && (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No matching properties found.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cart Section */}
            {cart.length > 0 && (
                <Card className="border-2 shadow-lg rounded-2xl overflow-hidden bg-white mb-8 border-emerald-200">
                    <div className="bg-emerald-50 py-4 px-6 border-b border-emerald-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                                {cart.length}
                            </div>
                            <h3 className="text-lg font-bold text-emerald-900">Selected Properties Cart</h3>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {cart.map((property) => (
                                <div key={property.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div>
                                        <h4 className="font-bold text-gray-900">{property.owner}</h4>
                                        <p className="text-sm text-gray-600 mt-1">Tax Dec: <span className="font-medium text-gray-900">{property.taxdecnumber}</span> • PIN: <span className="font-medium text-gray-900">{property.pin}</span></p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeFromCart(property.id)}
                                        className="shrink-0 w-full sm:w-auto font-medium"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    
                    <CardFooter className="px-6 py-5 border-t bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Button variant="ghost" onClick={handleBack} className="w-full sm:w-auto text-gray-600 hover:text-gray-900 font-medium">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous Step
                        </Button>
                        <p className="text-xs text-gray-500 font-bold hidden sm:block">
                            Step 2 of 4 • Cart Review
                        </p>
                        <Button
                            size="lg"
                            onClick={handleNext}
                            className="w-full sm:w-auto font-bold shadow-sm transition-all bg-emerald-600 hover:bg-emerald-700"
                        >
                            Next: Proceed to Transfer Tax
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
