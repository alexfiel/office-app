//lib/upload/librengsakay/liquidate-trip.ts

"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLiquidation(tripId: string, userId: string, formData: FormData) {
    // Fetch the trip data first to ensure we have the correct figures
    const trip = await prisma.librengSakayTrip.findUnique({
        where: { id: tripId },
    });

    if (!trip) throw new Error("Trip not found");

    await prisma.librengSakayLiquidation.create({
        data: {
            tripId: trip.id,
            userId: userId,
            departureDate: trip.departureDate,
            paymentDate: new Date(),
            arnumber: formData.get("arnumber") as string,
            driverName: trip.driverName,
            vehiclePlateNumber: trip.vehiclePlateNumber,
            numberofPax: trip.numberofPax,
            fare: trip.fare,
            amount: trip.amount,
            preparedby: formData.get("preparedby") as string, // Usually the current admin name
            approvedby: formData.get("approvedby") as string,
        },
    });

    revalidatePath("/admin/liquidations"); // Refresh the data on the page
}