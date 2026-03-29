"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { savePropertyCookieAction } from "@/lib/actions/cookies"
import { toast } from "sonner"

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
    createdAt?: string | Date;
}

export default function TaxdecList() {
    const [data, setData] = useState<RealPropertyInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchTaxdecs = async (currentPage: number, search: string) => {
        try {
            setLoading(true);
            setError(null);
            const queryParam = search ? `&query=${encodeURIComponent(search)}` : '';
            const res = await fetch(`/api/realproperty?page=${currentPage}&limit=${limit}${queryParam}`);
            
            if (!res.ok) throw new Error("Failed to fetch property list");

            const result = await res.json();
            setData(result.data);
            setTotal(result.pagination.total);
            setTotalPages(result.pagination.totalPages);

            if (search && result.data.length === 0) {
                toast.error("No properties found matching your search.");
            }
        } catch (error: any) {
            setError(error.message || "An unexpected error occurred");
            toast.error(error.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxdecs(page, debouncedSearch);
    }, [page, debouncedSearch, limit]);

    const toggleSelectAll = () => {
        if (selected.length === data.length && data.length > 0) {
            setSelected([]);
        } else {
            setSelected(data.map((item) => item.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleUseSelection = async (taxdec: RealPropertyInfo) => {
        setIsSaving(taxdec.id);
        const result = await savePropertyCookieAction({
            ...taxdec,
            marketValue: Number(taxdec.marketValue),
            area: Number(taxdec.area),
            lotNumber: taxdec.lotNumber,
            owner: taxdec.owner,
            location: taxdec.taxdecnumber, // Using TD No as location placeholder if needed
            tctOct: taxdec.tctOct,
        });

        if (result.success) {
            toast.success(`Active property set to ${taxdec.taxdecnumber}`);
        } else {
            toast.error("Failed to set active property.");
        }
        setIsSaving(null);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search TD No, PIN, or Owner..."
                            className="w-80 pl-4 h-10 border-gray-300 focus:ring-primary focus:border-primary rounded-md shadow-sm"
                        />
                        {loading && (
                            <div className="absolute right-3 top-2.5">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    Total Records: <span className="text-gray-900 font-bold">{total.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-xl shadow-sm bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={selected.length === data.length && data.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">TD No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PIN</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lot No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Area</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Market Value</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading && data.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={8} className="px-4 py-4 border-b">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500 italic">
                                    No property records found.
                                </td>
                            </tr>
                        ) : (
                            data.map((taxdec) => (
                                <tr 
                                    key={taxdec.id} 
                                    className={`hover:bg-gray-50 transition-colors duration-150 ${
                                        selected.includes(taxdec.id) ? "bg-blue-50/50" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selected.includes(taxdec.id)}
                                            onChange={() => toggleSelect(taxdec.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{taxdec.taxdecnumber}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{taxdec.pin}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{taxdec.owner}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{taxdec.lotNumber || "-"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{taxdec.area.toLocaleString()} sq.m</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">₱{Number(taxdec.marketValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary hover:text-primary-dark hover:bg-primary/10"
                                            onClick={() => handleUseSelection(taxdec)}
                                            disabled={isSaving === taxdec.id}
                                        >
                                            {isSaving === taxdec.id ? "Setting..." : "Set Active"}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
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
                            disabled={page === 1 || loading}
                            onClick={() => setPage(prev => prev - 1)}
                            className="bg-white"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(prev => prev + 1)}
                            className="bg-white"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
