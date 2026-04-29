import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
    const user = await prisma.user.upsert({
        where: { email: 'admin@admin.com' },
        update: {},
        create: {
            email: 'admin@admin.com',
            name: 'Admin',
            password: 'SUPERADMIN',
            role: 'ADMIN',
            designation: 'Admin'
        }
    })
    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })