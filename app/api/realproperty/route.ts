import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Get tax dec number or pin for the authenticated user
export async function GET(req: Request) {
    try {
        const session = await auth();

        // SECURITY CHECK: AUTHENTICATED USER ONLY
        if (!session || !session.user?.id) {
            return NextResponse.json(
                { error: "unauthorized access" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");
        const tdNo = searchParams.get("taxdecnumber");
        const pin = searchParams.get("pin");
        
        // Pagination params
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // BASE FILTER: ALWAYS SCOPE TO CURRENT USER
        const whereClause: any = {};

        // INTEGRATED SEARCH LOGIC
        if (query) {
            // GLOBAL SEARCH (EITHER FIELD)
            whereClause.OR = [
                { taxdecnumber: { contains: query, mode: "insensitive" } },
                { pin: { contains: query, mode: "insensitive" } },
                { owner: { contains: query, mode: "insensitive" } },
            ];
        } else if (tdNo || pin) {
            // SPECIFIC FIELD SEARCH (LEGACY SUPPORT)
            if (tdNo) whereClause.taxdecnumber = { contains: tdNo, mode: "insensitive" };
            if (pin) whereClause.pin = { contains: pin, mode: "insensitive" };
        }

        // FETCH DATA AND TOTAL COUNT IN PARALLEL
        const [taxDecs, totalCount] = await Promise.all([
            prisma.realProperty.findMany({
                where: whereClause,
                orderBy: { taxdecnumber: "asc" },
                skip: skip,
                take: limit,
            }),
            prisma.realProperty.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            data: taxDecs,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('ERROR FETCHING TAX DEC OR PIN:', error);
        return NextResponse.json(
            { message: 'failed to fetch tax declaration or pin records.' },
            { status: 500 }
        );
    }
}