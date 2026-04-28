import jsPDF from 'jspdf';
import { format } from "date-fns";

interface ReceiptData {
    arNumber: string;
    date: Date;
    amount: number;
    vendorName: string;
    controlNo: string;
    userName: string;
}

export const downloadReceiptAsPDF = async (data: ReceiptData) => {
    const { arNumber, date, amount, vendorName, controlNo, userName } = data;

    // Half Folio size (Landscape)
    const PAGE_WIDTH = 215.9;
    const PAGE_HEIGHT = 165.1;
    const MARGIN = 15;

    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [PAGE_HEIGHT, PAGE_WIDTH] // [Height, Width] for landscape
    });

    const centerX = PAGE_WIDTH / 2;
    let currentY = 15;

    // 1. Header (Logo/Title)
    // Note: We can't easily include the PNG without loading it as base64, 
    // so we'll use text-based header for robustness as in LibrengSakay example

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0);
    pdf.setFontSize(12);
    pdf.text("Republic of the Philippines", centerX, currentY, { align: "center" });

    currentY += 6;
    pdf.setFontSize(12);
    pdf.text("CITY GOVERNMENT OF TAGBILARAN", centerX, currentY, { align: "center" });

    currentY += 6;
    pdf.setFontSize(10);
    pdf.text("Tagbilaran City, Bohol, Philippines", centerX, currentY, { align: "center" });

    currentY += 12;
    pdf.setFontSize(14);
    pdf.text("FOOD VOUCHER PROGRAM", centerX, currentY, { align: "center" });

    currentY += 7;
    pdf.setFontSize(12);
    pdf.text("ACKNOWLEDGMENT RECEIPT", centerX, currentY, { align: "center" });

    currentY += 15;

    // 2. Receipt Info (AR No and Date)
    pdf.setFontSize(11);
    pdf.text(`A.R No: ${arNumber}`, MARGIN, currentY);
    pdf.text(`Date: ${format(date, "MMMM dd, yyyy")}`, PAGE_WIDTH - MARGIN, currentY, { align: "right" });

    currentY += 10;

    // 3. Body Text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);

    const bodyText = `Received from the CITY GOVERNMENT OF TAGBILARAN the total amount of ${amountToWords(amount)} (P${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), representing payment/reimbursement for food vouchers accepted by the undersigned as an accredited vendor under the CITY’S FOOD VOUCHER PROGRAM, covered by CLAIM FORM with CONTROL NUMBER ${controlNo}.`;

    const splitText = pdf.splitTextToSize(bodyText, PAGE_WIDTH - (MARGIN * 2));
    pdf.text(splitText, MARGIN, currentY);

    currentY += (splitText.length * 6) + 2;

    pdf.text("The undersigned hereby acknowledge that the said amount corresponds to the value of food vouchers duly submitted, examined, and approved for reimbursement in accordance with the existing guidelines.", MARGIN, currentY, { maxWidth: PAGE_WIDTH - (MARGIN * 2) });

    currentY += 10;

    // 4. Certifications
    pdf.setFont("helvetica", "bolditalic");
    pdf.text("The undersigned further certifies that:", MARGIN, currentY);

    currentY += 5;
    pdf.setFont("helvetica", "normal");
    const certs = [
        "1. The vouchers reimbursed have not been previously claimed or paid;",
        "2. The amount received is correct and in full settlement of the claim; and",
        "3. This receipt is issued voluntarily for all legal intents and purposes."
    ];
    certs.forEach(cert => {
        pdf.text(cert, MARGIN + 5, currentY);
        currentY += 5;
    });

    currentY += 1;

    // 5. Signatures
    pdf.setFont("helvetica", "bold");
    const sigY = currentY + 10;

    // Signature lines should have enough space above them for an actual ink signature
    const signatureGap = 15;

    // Received By (Left Side)
    pdf.setFontSize(9);
    pdf.text("Received by:", MARGIN, sigY);

    pdf.setFontSize(11);
    const vendorDisplayName = vendorName.toUpperCase();
    pdf.text(vendorDisplayName, MARGIN + 40, sigY + signatureGap, { align: "center" });
    pdf.line(MARGIN + 10, sigY + signatureGap + 1, MARGIN + 70, sigY + signatureGap + 1);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("VENDOR NAME / REPRESENTATIVE", MARGIN + 40, sigY + signatureGap + 6, { align: "center" });

    // Issued By (Right Side)
    pdf.setFontSize(9);
    pdf.text("Issued by:", PAGE_WIDTH - MARGIN - 70, sigY);

    pdf.setFontSize(11);
    const userDisplayName = userName.toUpperCase();
    pdf.text(userDisplayName, PAGE_WIDTH - MARGIN - 30, sigY + signatureGap, { align: "center" });
    pdf.line(PAGE_WIDTH - MARGIN - 60, sigY + signatureGap + 1, PAGE_WIDTH - MARGIN, sigY + signatureGap + 1);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("CITY TREASURER'S OFFICE", PAGE_WIDTH - MARGIN - 30, sigY + signatureGap + 6, { align: "center" });

    // Save PDF
    pdf.save(`Receipt_${arNumber}.pdf`);
};

// Simple number to words for the PDF
const amountToWords = (num: number): string => {
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
