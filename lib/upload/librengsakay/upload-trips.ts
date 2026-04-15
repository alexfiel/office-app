"use server"
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function uploadTrips(data: any[], userId: string, selectedRouteId: string) {
    try {
        const routeExists = await prisma.librengSakayRoute.findUnique({
            where: { id: selectedRouteId }
        });

        if (!routeExists) throw new Error("The selected route is invalid.");

        const trips = data.map((row) => {
            const cleanRow: any = {};
            Object.keys(row).forEach(key => {
                const normalizedKey = key.toLowerCase().replace(/\s/g, '');
                cleanRow[normalizedKey] = row[key];
            });

            // Handle date variations
            const rawDate = cleanRow.departuredate || cleanRow.depaturedate || cleanRow.date || cleanRow.departure;
            const parsedDate = new Date(rawDate);
            
            // Handle numeric values
            const pax = parseInt(cleanRow.numberofpax || cleanRow.pax || 0) || 0;
            const fare = parseFloat(cleanRow.fare || cleanRow.price || routeExists.fare);

            return {
                departureDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
                driverName: String(cleanRow.drivername || cleanRow.driver || "Unknown"),
                vehiclePlateNumber: String(cleanRow.vehicleplate || cleanRow.vehicleplatenumber || cleanRow.plate || cleanRow.platenumber || "N/A"),
                numberofPax: pax,
                fare: fare,
                amount: pax * fare,
                routeId: selectedRouteId, // Always use system selection
                userId: userId,           // Always use system session
            };
        });

        const result = await prisma.librengSakayTrip.createMany({
            data: trips,
        });

        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Upload Error:", error.message);
        throw error;
    }
}