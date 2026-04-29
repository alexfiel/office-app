import React from 'react';
import { reportHeader } from './receiptHeader';
import { ReceiptBody } from './receiptBody';
import { ReceiptFooter } from './receiptFooter';

interface IssueARProps {
    arNumber: string;
    date: Date;
    amount: number;
    vendorName: string;
    controlNo: string;
    userName: string;
}

export default function IssueAR(props: IssueARProps) {
    return (
        <div className="bg-white p-6 w-[215.9mm] h-[165.1mm] mx-auto overflow-hidden border border-slate-100 print:border-0">
            {reportHeader()}
            <ReceiptBody {...props} />
            <ReceiptFooter userName={props.userName} vendorName={props.vendorName} />
        </div>
    );
}
