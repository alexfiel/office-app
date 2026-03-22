import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { realPropertySchema } from "@/lib/schema";
import { auth } from "@/auth";
import { z } from "zod";

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        // LOG THE ID: Check your terminal to see if this is 'undefined' or a real ID
        console.log("Attempting to update ID:", id);

        const validation = realPropertySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Validation failed', errors: validation.error.format() },
                { status: 400 }
            );
        }

        const updateRPT = await prisma.realProperty.update({
            // FIX: If your DB ID is a number, use: where: { id: Number(id) }
            where: { id: id },
            data: validation.data,
        });

        return NextResponse.json(updateRPT, { status: 200 });

    } catch (error: any) {
        console.error('Error updating real property:', error);

        // Specific check for Prisma "Record not found" error
        if (error.code === 'P2025') {
            return NextResponse.json(
                { message: 'Property not found in database. Please refresh.' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Failed to update real property.' },
            { status: 500 }
        );
    }
}
