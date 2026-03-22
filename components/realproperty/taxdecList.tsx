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

    //filters
    const [searchTerm, setSearchTerm] = useState("");

    // Toggle "Select All"
    const toggleSelectAll = () => {
        if (selected.length === data.length && data.length > 0) {
            setSelected([]); //unselect all
            setSelected(data.map((taxdec) => taxdec.id)); //select all
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
            location: taxdec.location,
            tctOct: taxdec.tctOct,
        });

        if (result.success) {
            toast.success(`Selected property ${taxdec.pin} saved!`);
        } else {
            toast.error("Failed to save property selection.");
        }
        setIsSaving(null);
    };

    const fetchTaxdecs = async () => {
        try {
            setLoading(true);
            setError(null);
            const queryParam = searchTerm ? `?query=${encodeURIComponent(searchTerm)}` : '';

            const res = await fetch(`/api/realproperty${queryParam}`);
            if (!res.ok) throw new Error("Failed to fetch tax dec or pin");

            const taxdecs: RealPropertyInfo[] = await res.json();
            setData(taxdecs);

            if (searchTerm) {
                if (taxdecs.length === 0) {
                    toast.error("No tax declarations found.");
                } else {
                    toast.success(`Found ${taxdecs.length} tax declaration(s).`);
                }
            }
        } catch (error: any) {
            setError(error.message || "Failed to fetch tax dec or pin");
            toast.error(error.message || "Failed to fetch tax dec or pin");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxdecs();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value.toUpperCase());
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        fetchTaxdecs();
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Real Property List</h2>
            <div className="mb-4 flex gap-4">
                <form onSubmit={handleSearchSubmit} className="mb-4 flex items-end space-x-2">
                    <Field>
                        <Label>Search by TD No. or PIN</Label>
                        <Input
                            type="text"
                            name="query"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Enter Tax Dec Number or PIN"
                            className="w-64"
                        />
                    </Field>
                    <Button type="submit">Search</Button>
                </form>


                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600">{error}</p>}

                {!loading && !error && data.length === 0 && (
                    <p>No tax declarations found.</p>
                )}
            </div>
            <div className="overflow-x-auto">

                {!loading && !error && data.length > 0 && (


                    <table className="min-w-full border">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="px-3 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selected.length === data.length && data.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="border px-4 py-2">TD No</th>
                                <th className="border px-4 py-2">PIN</th>
                                <th className="border px-4 py-2">Owner Name</th>
                                <th className="border px-4 py-2">Lot No</th>
                                <th className="border px-4 py-2">Location</th>
                                <th className="border px-4 py-2">Area</th>
                                <th className="border px-4 py-2">Market Value</th>
                                <th className="border px-4 py-2">Created At</th>
                                <th className="border px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((taxdec) => (
                                <tr key={taxdec.id} className={`border-b hover:bg-gray-50 ${selected.includes(taxdec.id) ? "bg-blue-50" : ""
                                    }`}>
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(taxdec.id)}
                                            onChange={() => toggleSelect(taxdec.id)}
                                        />
                                    </td>
                                    <td className="border px-4 py-2">{taxdec.taxdecnumber}</td>
                                    <td className="border px-4 py-2">{taxdec.pin}</td>
                                    <td className="border px-4 py-2">{taxdec.owner}</td>
                                    <td className="border px-4 py-2">{taxdec.lotNumber}</td>
                                    <td className="border px-4 py-2">{taxdec.location}</td>
                                    <td className="border px-4 py-2">{taxdec.area}</td>
                                    <td className="border px-4 py-2">{taxdec.marketValue?.toString()}</td>
                                    <td className="border px-4 py-2">{taxdec.createdAt ? new Date(taxdec.createdAt).toLocaleDateString() : "-"}</td>
                                    <td className="border px-4 py-2 text-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUseSelection(taxdec)}
                                            disabled={isSaving === taxdec.id}
                                        >
                                            {isSaving === taxdec.id ? "Saving..." : "Set Active"}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                )}
            </div>
        </div>
    )

}