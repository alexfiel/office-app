export function ReportHeader({ dateRange }: { dateRange?: { start: string, end: string } }) {
    let dateRangeText = "";
    if (dateRange) {
        if (dateRange.start === dateRange.end) {
            dateRangeText = new Date(dateRange.start).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } else {
            const startText = new Date(dateRange.start).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            const endText = new Date(dateRange.end).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            dateRangeText = `${startText} - ${endText}`;
        }
    }

    return (
        <div className="w-full mb-2 text-center pb-1 border-b-0">
            <div className="w-full flex justify-center items-center mb-6 min-h-[100px]">
                <div>
                    <p className="text-2xl font-bold">Republic of the Philippines</p>
                    <p className="text-2xl font-bold">CITY GOVERNMENT OF TAGBILARAN</p>
                    <p className="text-md font-bold">Tagbilaran City, Bohol, Philippines</p>
                </div>
            </div>
            <h1 className="text-2xl font-black tracking-widest text-slate-800 uppercase">LIBRENG SAKAY PROGRAM</h1>
            <span className="text-md font-black tracking-widest text-slate-800 uppercase">Payment Date: {dateRangeText}</span>

        </div>
    )
}   