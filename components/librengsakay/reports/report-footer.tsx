interface ReportFooterProps {
    userName: string;
}

export function ReportFooter({ userName }: ReportFooterProps) {
    return (
        <div className="grid grid-cols-2 gap-20 mt-16 text-sm">
            <div className="flex flex-col">
                <p className="mb-10 text-gray-600 italic text-xs">Prepared by:</p>
                <div className="border-b border-black pb-1">
                    <p className="font-bold uppercase text-center">{userName}</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Authorized Personnel / Staff</p>
            </div>

            <div className="flex flex-col">
                <p className="mb-10 text-gray-600 italic text-xs">Approved by:</p>
                <div className="border-b border-black pb-1">
                    <p className="font-bold uppercase text-center">HUBERT M. INAS, CPA</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 text-center">City Treasurer</p>
            </div>
        </div>
    )
}