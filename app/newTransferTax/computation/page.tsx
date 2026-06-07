import { TransferTaxComputation } from "@/components/newTransfertax/TransferTaxComputation";
import { Suspense } from "react";
import { Calculator } from "lucide-react";

export default function ComputationPage() {
    return (
        <div className="w-full h-full bg-slate-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Transfer Tax Assessment</h1>
                    <p className="text-sm text-slate-500 mt-1">Review the final computed tax details and save the transaction.</p>
                </div>
                
                <Suspense fallback={<div className="flex justify-center p-12"><div className="animate-pulse flex items-center gap-2"><Calculator className="w-5 h-5 text-gray-400" /> <span className="text-gray-500">Loading Assessment...</span></div></div>}>
                    <TransferTaxComputation />
                </Suspense>
            </div>
        </div>
    );
}
