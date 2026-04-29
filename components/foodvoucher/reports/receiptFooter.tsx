interface ReceiptFooterProps {
    userName: string;
    vendorName: string;
}
export function ReceiptFooter({ userName, vendorName }: ReceiptFooterProps) {
    return (
        <div className="grid grid-cols-2 gap-10 pt-2">
            {/* Signatures */}
            <div className="text-center space-y-1">
                <div className="text-[10px] font-bold text-slate-800 print:text-black uppercase tracking-widest text-left">Received by:</div>
                <div className="mt-4">
                    <div className="font-black text-base border-b border-slate-900 pb-1 uppercase">{vendorName}</div>
                    <div className="text-[10px] font-bold text-slate-800 print:text-black mt-1 uppercase tracking-tight">VENDOR NAME / REPRESENTATIVE</div>
                </div>
            </div>

            <div className="text-center space-y-1">
                <div className="text-[10px] font-bold text-slate-800 print:text-black uppercase tracking-widest text-left">Issued by:</div>
                <div className="mt-4">
                    <div className="font-black text-base border-b border-slate-900 pb-1 uppercase">{userName}</div>
                    <div className="text-[10px] font-bold text-slate-800 print:text-black mt-1 uppercase tracking-tight">CITY TREASURER'S OFFICE</div>
                </div>
            </div>
        </div>
    )
}