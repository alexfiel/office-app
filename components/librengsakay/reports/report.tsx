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
            {/* Add ID here */}
            <div id="report-header">
                <ReportHeader dateRange={dateRange} />
                <div className="mt-4 mb-4">
                    <p className="text-center text-sm font-bold italic">Route: {routeName}</p>
                    <span className="text-[10px] text-gray-500">Date Printed: {new Date().toLocaleDateString()}</span>
                </div>
            </div>
            <br />
            <br />

            {/* This remains for the browser view */}
            <ReportDetails
                routeName={routeName}
                data={data}
                totalPax={totalPax}
                totalAmount={totalAmount}
            />

            {/* Add ID here */}
            <div id="report-footer">
                <ReportFooter userName={userName} />
            </div>

            <div className="mt-10 text-[10px] text-gray-400 text-center italic print:hidden">
                * Press Ctrl + P to print this report for the City Treasurer's Office.
            </div>
        </div>
    )
}