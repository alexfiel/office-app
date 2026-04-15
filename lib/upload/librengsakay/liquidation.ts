"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";


//fetch trips for a specification route and date that ARE Not yet liquidated

export async function getPendingTrips(routeId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.librengSakayTrip.findMany({
        where: {
            routeId: routeId,
            departureDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            liquidations: { none: {} }
        },
        orderBy: { driverName: "asc" },
    });
}

//2. Save the liquidation

export async function saveLiquidations(items: any[], userId: string) {
    try {
        const results = await prisma.$transaction(
            items.map((data) =>
                prisma.librengSakayLiquidation.create({
                    data: {
                        tripId: data.tripId,
                        userId: userId,
                        departureDate: new Date(data.departureDate),
                        paymentDate: new Date(data.paymentDate || new Date()),
                        arnumber: data.arnumber,
                        driverName: data.driverName,
                        vehiclePlateNumber: data.vehiclePlateNumber,
                        numberofPax: parseInt(data.numberofPax),
                        fare: parseFloat(data.fare),
                        amount: parseFloat(data.amount),
                        preparedby: data.preparedby,
                        approvedby: data.approvedby,
                    }
                })
            )
        );

        revalidatePath("/librengsakay");
        return results;
    } catch (error: any) {
        console.error("Liquidation Bulk Save Error:", error.message);
        throw error;
    }
}


// 3. Get Liquidation Report
export async function getLiquidationReport(startDate: string, endDate: string, routeId?: string) {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const where: any = {
            departureDate: {
                gte: start,
                lte: end
            }
        };

        if (routeId) {
            where.trip = {
                routeId: routeId
            };
        }

        return await prisma.librengSakayLiquidation.findMany({
            where,
            include: {
                trip: {
                    include: {
                        route: {
                            select: {
                                routeName: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { departureDate: "desc" }
        });
    } catch (error: any) {
        console.error("Liquidation Report Error:", error.message);
        throw error;
    }
}

// 4. Get All Trip Logs (Master List)
export async function getTripLogs() {
    try {
        return await prisma.librengSakayTrip.findMany({
            include: {
                route: {
                    select: {
                        routeName: true
                    }
                },
                liquidations: {
                    select: {
                        arnumber: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { departureDate: "desc" },
            take: 200 // Limit for initial performance
        });
    } catch (error: any) {
        console.error("Trip Logs Error:", error.message);
        throw error;
    }
}
