import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter
const rateLimitMap = new Map<
    string,
    { count: number; resetTime: number }
>();

const LIMIT = 20;
const WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip: string) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + WINDOW,
        });
        return false;
    }

    if (record.count >= LIMIT) {
        return true;
    }

    record.count++;
    return false;
}

export async function POST(req: Request) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";

    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: "Too many requests" },
            { status: 429 }
        );
    }

    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
        return NextResponse.json(
            { error: "API Key required" },
            { status: 401 }
        );
    }

    const keyRecord = await prisma.apiKeyModel.findUnique({
        where: {
            key: apiKey,
        },
    });

    if (!keyRecord) {
        return NextResponse.json(
            { error: "Invalid API Key" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();

        const {
            market,
            stallNo,
            vendorName,
            claimControlNo,
            totalAmount,
            // verifiedVoucherCodes,
        } = body;

        // Required field validation
        if (
            !market ||
            !stallNo ||
            !vendorName ||
            !claimControlNo ||
            totalAmount === undefined
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate verifiedVoucherCodes
        //if (!Array.isArray(verifiedVoucherCodes)) {
        //  return NextResponse.json(
        //    {
        //      error:
        //        "verifiedVoucherCodes is required and must be an array",
        // },
        //{ status: 400 }
        //);
        //}

        //for (const code of verifiedVoucherCodes) {
        //  if (
        //    typeof code !== "string" ||
        //  code.trim() === ""
        //) {
        //  return NextResponse.json(
        //    {
        //      error:
        //        "All verified voucher codes must be non-empty strings",
        // },
        //{ status: 400 }
        //);
        //}

        const claim = await prisma.foodVoucherVendorClaim.create({
            data: {
                market,
                stallNo,
                vendorName,
                claimControlNo,
                totalAmount: parseFloat(totalAmount.toString()),
                userId: keyRecord.userId,
                //verifiedVoucherCodes,
            },
        });
        return NextResponse.json(
            {
                message: "Claim recorded successfully",
                claimId: claim.id,
                controlNo: claim.claimControlNo,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error(
            "Error creating vendor claim:",
            error
        );

        if (error.code === "P2002") {
            return NextResponse.json(
                {
                    error:
                        "Duplicate claim control number",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                error: "Internal Server Error",
                details: error.message,
            },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
        return NextResponse.json(
            { error: "API Key required" },
            { status: 401 }
        );
    }

    const keyRecord = await prisma.apiKeyModel.findUnique({
        where: {
            key: apiKey,
        },
    });

    if (!keyRecord) {
        return NextResponse.json(
            { error: "Invalid API Key" },
            { status: 401 }
        );
    }

    const { searchParams } = new URL(req.url);
    const controlNo = searchParams.get("controlNo");

    if (!controlNo) {
        return NextResponse.json(
            { error: "controlNo required" },
            { status: 400 }
        );
    }

    try {
        const claim =
            await prisma.foodVoucherVendorClaim.findFirst({
                where: {
                    claimControlNo: controlNo,
                },
                include: {
                    acknowledgement: true,
                },
            });

        if (!claim) {
            return NextResponse.json(
                { error: "Claim not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(claim);
    } catch (error) {
        console.error(
            "Error fetching vendor claim:",
            error
        );

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}