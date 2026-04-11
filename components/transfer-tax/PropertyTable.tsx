// components/transfer-tax/PropertyTable.tsx

import { Button } from "@/components/ui/button";
import { RealPropertyInfo } from "@/lib/types/property";

interface PropertyTabProps {
    properties: RealPropertyInfo[];
    onRemove?: (id: string) => void;
    showActions?: boolean;
}

export function PropertyTable({
    properties,
    onRemove,
    showActions = false }: PropertyTabProps) {
    const totalMV = properties.reduce((sum, p) => sum + Number(p.marketValue || 0), 0);

    return (
        <div className="overflow-x auto border rounded-md">
            <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-4 py-2 text-left">Owner</th>
                        <th className="px-4 py-2 text-left">TD No</th>
                        <th className="px-4 py-2 text-center">Lot No</th>
                        <th className="px-4 py-2 text-center">Area (sqm)</th>
                        <th className="px-4 py-2 text-right">Market Value</th>
                        {showActions && <th className="px-4 py-2 text-left">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {properties.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30">
                            <td className="px-4 py-2">{item.owner}</td>
                            <td className="px-4 py-2">{item.taxdecnumber}</td>
                            <td className="px-4 py-2 text-center">{item.lotNumber}</td>
                            <td className="px-4 py-2 text-center">{item.area}</td>
                            <td className="px-4 py-2 text-right">₱ {Number(item.marketValue).toLocaleString()}</td>
                            {showActions && (
                                <td className="px-4 py-2">
                                    <Button variant="ghost" size="sm" onClick={() => onRemove?.(item.id)}>
                                        Remove
                                    </Button>
                                </td>
                            )}
                        </tr>
                    ))}
                    <tr className="bg-muted/50 font-bold">
                        <td colSpan={3} className="px-4 py-2 text-right">Total Market Value:</td>
                        <td className="px-4 py-2 text-right text-primary">₱ {Number(totalMV).toLocaleString()}</td>
                        {showActions && <td></td>}
                    </tr>
                </tbody>


            </table>
        </div>
    )


}
