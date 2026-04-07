export function SignatureBlock({ preparedBy, designation }: { preparedBy: string, designation: string }) {
    return (
        <div className="grid grid-cols-2 gap-10 mb-10 py-8 border-y border-dashed border-slate-300">
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">Prepared by:</p>
                <div className="border-b-2 border-slate-900 w-[85%] pb-1">
                    <p className="font-bold text-slate-900 text-lg uppercase truncate">{preparedBy}</p>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-2 tracking-widest uppercase">{designation}</p>
            </div>
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-8">Approved by:</p>
                <div className="border-b-2 border-slate-900 w-[85%] pb-1 h-7">
                    <p className="font-bold text-slate-900 text-lg uppercase truncate">HUBERT M. INAS, CPA, BCLTE</p>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-widest">City Treasurer / Authorized Personnel</p>
            </div>
        </div>
    );
}