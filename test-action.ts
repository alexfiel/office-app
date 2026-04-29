import { bulkAddVendors } from './lib/actions/foodvoucher';
import { PrismaClient } from "@prisma/client";

async function test() {
    const prisma = new PrismaClient();
    const user = await prisma.user.findFirst();
    await prisma.$disconnect();

    if (!user) throw new Error("No user");

    const data = [
        {
            vendorName: "John's Fruit Stand",
            market: 'Tagbilaran Central Market',
            stallNo: 'A-12',
            userId: user.id
        },
        {
            vendorName: "Maria's Veggies",
            market: 'Cogon Market',
            stallNo: 'B-05',
            userId: user.id
        },
        {
            vendorName: "Tony's Meat Shop",
            market: 'Dao Public Market',
            stallNo: '',
            userId: user.id
        },
        {
            vendorName: "Elena's Groceries",
            market: 'Tagbilaran Central Market',
            stallNo: 'C-22',
            userId: user.id
        }
    ];

    try {
        await bulkAddVendors(data);
        console.log("Success");
    } catch (e: any) {
        console.error("Action Error:", e);
    }
}
test();
