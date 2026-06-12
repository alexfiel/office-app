"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTransactionsByNotarialId } from "@/lib/actions/transfertax-actions";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ReportTransferTaxCompSheet } from "@/components/newTransfertax/ReportTransferTaxCompSheet";
import { useSession } from "next-auth/react";

export default function NotarialDocumentSummary() {
    const { data: session } = useSession();
    const params = useParams();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            if (!params.notarialId) return;
            try {
                const res = await getTransactionsByNotarialId(params.notarialId as string);
                if (res.error) {
                    toast.error(res.error);
                } else {
                    setData(res.document);
                }
            } catch (error) {
                console.error("Failed to load summary", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, [params.notarialId]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-12 space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-gray-600 font-medium">Generating Report...</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Document Not Found</h2>
                <Button onClick={() => router.push("/newTransferTax")} className="mt-4">Return Home</Button>
            </div>
        );
    }

    // Calculate Grand Totals
    const totalTransactions = data.newTransferTaxes.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grandTotalTax = data.newTransferTaxes.reduce((sum: number, tx: any) => sum + Number(tx.t_TotalAmountDue), 0);

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        Transactions Completed
                    </h1>
                    <p className="text-gray-500 mt-1">Here is the full summary of all computations processed under this document.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push("/newTransferTax")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Button>
                    <ReportTransferTaxCompSheet data={data} userName={session?.user?.name || "TRANSFER TAX ASSESSOR"} />
                </div>
            </div>

            <Card className="border-2 shadow-sm border-blue-100">
                <div className="bg-blue-50/50 p-6 border-b border-blue-100">
                    <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notarial Document Details
                    </h2>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-blue-600/70 font-semibold text-xs uppercase tracking-wider">Doc Title</p>
                            <p className="font-semibold text-gray-900 mt-1">{data.documentName}</p>
                        </div>
                        <div>
                            <p className="text-blue-600/70 font-semibold text-xs uppercase tracking-wider">Doc Type</p>
                            <p className="font-semibold text-gray-900 mt-1">{data.documentType}</p>
                        </div>
                        <div>
                            <p className="text-blue-600/70 font-semibold text-xs uppercase tracking-wider">Notarial Date</p>
                            <p className="font-semibold text-gray-900 mt-1">{new Date(data.notarialDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-blue-600/70 font-semibold text-xs uppercase tracking-wider">Notarized By</p>
                            <p className="font-semibold text-gray-900 mt-1">{data.notarizedBy}</p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4">Control No.</th>
                                    <th className="px-6 py-4">Transferor</th>
                                    <th className="px-6 py-4">Transferee</th>
                                    <th className="px-6 py-4">Properties (TD / Lot / Area)</th>
                                    <th className="px-6 py-4 text-right">Amount Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {data.newTransferTaxes.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                                            {tx.t_controlNumber}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {Array.from(new Set(tx.t_transfertaxdetails.map((d: any) => d.nt_transferror))).join(" / ") || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {Array.from(new Set(tx.t_transfertaxdetails.map((d: any) => d.nt_transferee))).join(" / ") || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                {tx.t_transfertaxdetails.map((dt: any, i: number) => (
                                                    <div key={i} className="flex gap-2 items-center flex-wrap">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                            TD: {dt.realProperty?.taxdecnumber || dt.nt_taxdecnumber}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                            Lot: {dt.realProperty?.lotnumber || dt.nt_lotnumber || "N/A"}
                                                        </span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                            Area: {dt.realProperty?.area || dt.nt_area || 0} sqm
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            ₱{Number(tx.t_TotalAmountDue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                {data.newTransferTaxes.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No transactions were found for this document.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>

                <CardFooter className="bg-gray-50 p-6 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Total Transactions Processed: <span className="font-bold text-gray-900">{totalTransactions}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600 font-bold uppercase tracking-wider text-sm">Grand Total</span>
                        <span className="text-2xl font-black text-emerald-600">
                            ₱{grandTotalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
