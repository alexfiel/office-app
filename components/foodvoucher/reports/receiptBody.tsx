import { format } from "date-fns";

interface ReceiptBodyProps {
    arNumber: string;
    date: Date;
    amount: number;
    vendorName: string;
    controlNo: string;
    userName: string;
}

const numberToWords = (num: number): string => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

    const convertLessThanThousand = (n: number): string => {
        let str = '';
        if (n >= 100) {
            str += ones[Math.floor(n / 100)] + ' HUNDRED ';
            n %= 100;
        }
        if (n >= 10 && n <= 19) {
            str += teens[n - 10] + ' ';
        } else {
            if (n >= 20) {
                str += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            }
            if (n > 0) {
                str += ones[n] + ' ';
            }
        }
        return str;
    };

    if (num === 0) return 'ZERO';

    let result = '';
    const million = Math.floor(num / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = Math.floor(num % 1000);
    const cents = Math.round((num % 1) * 100);

    if (million > 0) result += convertLessThanThousand(million) + 'MILLION ';
    if (thousand > 0) result += convertLessThanThousand(thousand) + 'THOUSAND ';
    if (remainder > 0) result += convertLessThanThousand(remainder);

    if (cents > 0) {
        result += `AND ${cents}/100 `;
    }

    return result.trim() + ' PESOS ONLY';
};

export function ReceiptBody({ arNumber, date, amount, vendorName, controlNo, userName }: ReceiptBodyProps) {
    return (
        <div className="text-slate-800 leading-tight space-y-2 py-2 px-4">
            {/* Header Info */}
            <div className="flex justify-between font-bold text-base">
                <div>A.R No: <span className="font-mono">{arNumber}</span></div>
                <div>Date: <span className="underline decoration-dotted underline-offset-4">{format(date, "MMMM dd, yyyy")}</span></div>
            </div>

            {/* Main Statement */}
            <div className="text-justify text-sm space-y-3">
                <p>
                    Received from the <span className="font-bold">CITY GOVERNMENT OF TAGBILARAN</span> the total amount of
                    <span className="font-bold border-b border-slate-900 px-2 mx-1 uppercase italic">
                        {numberToWords(amount)}
                    </span>
                    (<span className="font-bold">₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>),
                    representing payment/reimbursement for food vouchers accepted by the undersigned as an accredited vendor under the
                    <span className="font-bold"> CITY’S FOOD VOUCHER PROGRAM</span>, covered by <span className="font-bold">CLAIM FORM</span> with
                    CONTROL NUMBER <span className="font-mono font-bold">{controlNo}</span>.
                </p>

                <p>
                    The undersigned hereby acknowledge that the said amount corresponds to the value of food vouchers duly submitted,
                    examined, and approved for reimbursement in accordance with the existing guidelines.
                </p>
            </div>

            {/* Certifications */}
            <div className="space-y-2 text-sm">
                <p className="font-bold italic underline">The undersigned further certifies that:</p>
                <ol className="list-decimal list-inside pl-6 space-y-1 font-medium">
                    <li>The vouchers reimbursed have not been previously claimed or paid;</li>
                    <li>The amount received is correct and in full settlement of the claim; and</li>
                    <li>This receipt is issued voluntarily for all legal intents and purposes.</li>
                </ol>
            </div>


        </div>
    );
}