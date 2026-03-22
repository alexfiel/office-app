"use client";

export interface TaxDecItem {
    id: string;
    tdNo: string;
    pin: string;
    lotNumber: string;
    owner: string;
    location: string;
    marketValue: number;
    area: number;
    tctOct: string;
}

export async function getTaxDecBySearch(tdNo?: string, pin?: string): Promise<TaxDecItem[] | TaxDecItem | null> {
    try {
        const params = new URLSearchParams();
        if (tdNo) params.set("taxdecnumber", tdNo);
        if (pin) params.set("pin", pin);

        const response = await fetch(`/api/realproperty?${params.toString()}`);
        if (!response.ok) {
            throw new Error("Failed to fetch taxdec or pin");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching taxdec or pin:", error);
        return null;
    }
}