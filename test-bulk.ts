import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
    let user = await prisma.user.findFirst()
    if (!user) {
        user = await prisma.user.create({
            data: {
                name: 'Test',
                email: 'test@example.com',
                password: 'password',
                designation: 'Tester'
            }
        })
    }

    try {
        await prisma.foodVoucherVendor.createMany({
            data: [
                { vendorName: 'Test1', market: 'M1', stallNo: '', userId: user.id },
                { vendorName: 'Test2', market: 'M2', stallNo: 'S2', userId: user.id }
            ]
        })
        console.log('Success')
    } catch (err) {
        console.error('Prisma Error:', err)
    } finally {
        await prisma.$disconnect()
    }
}
main()
