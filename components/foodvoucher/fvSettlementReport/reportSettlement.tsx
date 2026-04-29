import React from 'react';
import { ReportSettlementHeader } from './reportSettlementHeader';
import { ReportSettlementDetails } from './reportSettlementDetails';
import { ReportSettlementFooter } from './reportSettlementFooter';

interface ReportSettlementProps {
    settlement: any;
    userName: string;
}

export function ReportSettlement({ settlement, userName }: ReportSettlementProps) {
    return (
        <div className="w-full bg-white p-8 max-w-4xl mx-auto border shadow-sm my-4 print:shadow-none print:border-none print:m-0 print:p-0">
            <ReportSettlementHeader />
            <ReportSettlementDetails settlement={settlement} />
            <ReportSettlementFooter userName={userName} />
        </div>
    );
}
