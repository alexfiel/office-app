import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ controlno: string }> }) {
    try {
        const session = await auth();

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { controlno } = await params;

        const record = await prisma.newTransferTax.findUnique({
            where: { t_controlNumber: controlno },
            include: {
                notarialDocument: true,
                t_transfertaxdetails: {
                    include: {
                        realProperty: true
                    }
                },
                capturedPayment: true
            }
        });

        if (!record) {
            return NextResponse.json({ error: "Computation not found" }, { status: 404 });
        }

        return NextResponse.json(record, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching new transfer tax computation:", error);
        return NextResponse.json({ error: "Failed to fetch computation" }, { status: 500 });
    }
}
