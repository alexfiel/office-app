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
        <div className="overflow-x-auto border rounded-md">
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
                <tbody className="divide-y text-[11px]">
                    {properties.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30">
                            <td className="px-4 py-2 uppercase font-medium">{item.owner}</td>
                            <td className="px-4 py-2 font-mono">{item.taxdecnumber}</td>
                            <td className="px-4 py-2 text-center font-mono">{item.lotNumber}</td>
                            <td className="px-4 py-2 text-center font-mono">{item.area}</td>
                            <td className="px-4 py-2 text-right font-mono">
                                {Number(item.marketValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            {showActions && (
                                <td className="px-4 py-2">
                                    <Button variant="ghost" size="sm" onClick={() => onRemove?.(item.id)} className="h-7 text-destructive hover:text-destructive">
                                        Remove
                                    </Button>
                                </td>
                            )}
                        </tr>
                    ))}
                    <tr className="bg-muted/50 font-bold border-t-2">
                        <td colSpan={4} className="px-4 py-3 text-right">AGGREGATE MARKET VALUE:</td>
                        <td className="px-4 py-3 text-right text-primary font-mono text-sm underline decoration-double">
                            P {Number(totalMV).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        {showActions && <td></td>}
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
