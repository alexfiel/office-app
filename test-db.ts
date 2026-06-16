import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const tx = await prisma.newTransferTax.findFirst({
        where: { t_status: 'pending' },
        include: { notarialDocument: true }
    });
    if (!tx) {
        console.log("No pending tx");
        return;
    }
    console.log("Found tx:", tx.id, "userId:", tx.notarialDocument.userId);
    
    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { id: tx.notarialDocument.userId } });
    console.log("User found:", user ? user.id : "NO USER");

    try {
        await prisma.capturedPayment.create({
            data: {
                cp_receiptnumber: "TEST-" + Date.now(),
                cp_amount: 100,
                cp_paymentDate: new Date(),
                cp_remarks: "Paid",
                cp_modeOfPayment: "Cash",
                cp_NewTransferTaxId: tx.id,
                cp_UserId: tx.notarialDocument.userId
            }
        });
        console.log("Payment created successfully!");
    } catch(e) {
        console.error("Error creating payment:", e);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
