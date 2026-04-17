import { ReportHeader } from "./report-header";
import { ReportDetails } from "./report-details";
import { ReportFooter } from "./report-footer";

interface ReportProps {
    routeName: string;
    data: any[];
    userName: string;
    dateRange?: { start: string, end: string };
}

export function Report({ routeName, data, userName, dateRange }: ReportProps) {
    const totalPax = data.reduce((sum, item) => sum + item.numberofPax, 0);
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="w-full p-8 bg-white text-black min-h-screen">
            <ReportHeader dateRange={dateRange} />
            <ReportDetails 
                routeName={routeName} 
                data={data} 
                totalPax={totalPax} 
                totalAmount={totalAmount} 
            />
            <ReportFooter userName={userName} />
            
            <div className="mt-10 text-[10px] text-gray-400 text-center italic print:hidden">
                * Press Ctrl + P to print this report for the City Treasurer's Office.
            </div>
        </div>
    )
}