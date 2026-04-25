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


// 2.5 Check if AR Number already exists
export async function checkArNumberExists(arnumber: string) {
    const existing = await prisma.librengSakayLiquidation.findFirst({
        where: { arnumber }
    });
    return !!existing;
}


// 3. Get Liquidation Report
export async function getLiquidationReport(startDate: string, endDate: string, routeId?: string) {
    try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const where: any = {
            paymentDate: {
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
            orderBy: [
                { arnumber: 'desc' },
                { paymentDate: 'desc' }
            ],
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
            }
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
                        id: true,
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

// 5. Update Trip Log (Only if not liquidated)
export async function updateTripLog(tripId: string, data: { driverName: string, numberofPax: number, fare: number, amount: number }) {
    try {
        const trip = await prisma.librengSakayTrip.findUnique({
            where: { id: tripId },
            include: { liquidations: true }
        });

        if (!trip) throw new Error("Trip not found");
        if (trip.liquidations.length > 0) throw new Error("Cannot update a liquidated trip");

        const result = await prisma.librengSakayTrip.update({
            where: { id: tripId },
            data: {
                driverName: data.driverName,
                numberofPax: data.numberofPax,
                fare: data.fare,
                amount: data.amount
            }
        });

        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Update Trip Log Error:", error.message);
        throw error;
    }
}

// 6. Update Liquidation Record
export async function updateLiquidation(liquidationId: string, data: any, userId: string, userRole: string) {
    try {
        const liquidation = await prisma.librengSakayLiquidation.findUnique({
            where: { id: liquidationId }
        });

        if (!liquidation) throw new Error("Liquidation record not found");
        if (liquidation.userId !== userId && userRole !== "ADMIN") {
            throw new Error("You are not authorized to edit this record");
        }

        const result = await prisma.librengSakayLiquidation.update({
            where: { id: liquidationId },
            data: {
                arnumber: data.arnumber,
                driverName: data.driverName,
                vehiclePlateNumber: data.vehiclePlateNumber,
                numberofPax: data.numberofPax,
                fare: data.fare,
                amount: data.amount,
                departureDate: new Date(data.departureDate),
                paymentDate: new Date(data.paymentDate)
            }
        });

        // Also sync the Trip amount/fare if desired, but for now we just sync the Liquidation logic 
        // to match requirements "edit liquidation". We will update corresponding Trip fields too:
        if (liquidation.tripId) {
            await prisma.librengSakayTrip.update({
                where: { id: liquidation.tripId },
                data: {
                    driverName: data.driverName,
                    vehiclePlateNumber: data.vehiclePlateNumber,
                    numberofPax: data.numberofPax,
                    fare: data.fare,
                    amount: data.amount
                }
            })
        }

        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Update Liquidation Error:", error.message);
        throw error;
    }
}

// 7. Transfer Trips Route
export async function transferTripRoutes(tripIds: string[], newRouteId: string) {
    try {
        if (!tripIds || tripIds.length === 0) throw new Error("No trips selected");
        if (!newRouteId) throw new Error("New route is required");

        const result = await prisma.librengSakayTrip.updateMany({
            where: { id: { in: tripIds } },
            data: { routeId: newRouteId }
        });

        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Transfer Trip Routes Error:", error.message);
        throw error;
    }
}

// 8. Create Trip Log
export async function createTripLog(data: { driverName: string; vehiclePlateNumber: string; numberofPax: number; fare: number; amount: number; routeId: string; departureDate: Date }, userId: string) {
    try {
        const result = await prisma.librengSakayTrip.create({
            data: {
                driverName: data.driverName,
                vehiclePlateNumber: data.vehiclePlateNumber,
                numberofPax: data.numberofPax,
                fare: data.fare,
                amount: data.amount,
                routeId: data.routeId,
                departureDate: new Date(data.departureDate),
                userId: userId,
            }
        });
        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Create Trip Log Error:", error.message);
        throw error;
    }
}

// 9. Delete Trip Log
export async function deleteTripLog(tripId: string) {
    try {
        const trip = await prisma.librengSakayTrip.findUnique({
            where: { id: tripId },
            include: { liquidations: true }
        });

        if (!trip) throw new Error("Trip not found");
        if (trip.liquidations.length > 0) throw new Error("Cannot delete a liquidated trip");

        const result = await prisma.librengSakayTrip.delete({
            where: { id: tripId }
        });

        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Delete Trip Log Error:", error.message);
        throw error;
    }
}

// 10. Delete Multiple Trip Logs
export async function deleteTripLogs(tripIds: string[]) {
    try {
        if (!tripIds || tripIds.length === 0) throw new Error("No trips selected for deletion");

        const trips = await prisma.librengSakayTrip.findMany({
            where: { id: { in: tripIds } },
            include: { liquidations: true }
        });

        const invalidTrips = trips.filter(t => t.liquidations.length > 0);
        if (invalidTrips.length > 0) {
            throw new Error(`Cannot delete ${invalidTrips.length} trip(s) because they are already liquidated`);
        }

        const result = await prisma.librengSakayTrip.deleteMany({
            where: { id: { in: tripIds } }
        });

        revalidatePath("/librengsakay");
        return result;
    } catch (error: any) {
        console.error("Bulk Delete Trip Logs Error:", error.message);
        throw error;
    }
}

// 11. Search Trips
export async function searchTrips(filters: {
    driverName?: string;
    plateNumber?: string;
    routeId?: string;
    status?: 'ALL' | 'PENDING' | 'LIQUIDATED';
    tripDate?: string;
    paymentDate?: string;
}) {
    try {
        const where: any = {};
        
        if (filters.driverName) {
            where.driverName = { contains: filters.driverName, mode: 'insensitive' };
        }
        if (filters.plateNumber) {
            where.vehiclePlateNumber = { contains: filters.plateNumber, mode: 'insensitive' };
        }
        if (filters.routeId) {
            where.routeId = filters.routeId;
        }
        if (filters.tripDate) {
            const startTrip = new Date(filters.tripDate);
            startTrip.setHours(0, 0, 0, 0);
            const endTrip = new Date(filters.tripDate);
            endTrip.setHours(23, 59, 59, 999);
            where.departureDate = {
                gte: startTrip,
                lte: endTrip
            };
        }
        
        let liquidationConditions: any = {};
        if (filters.paymentDate) {
            const startPay = new Date(filters.paymentDate);
            startPay.setHours(0, 0, 0, 0);
            const endPay = new Date(filters.paymentDate);
            endPay.setHours(23, 59, 59, 999);
            liquidationConditions.paymentDate = {
                gte: startPay,
                lte: endPay
            };
        }

        if (filters.status === 'PENDING') {
            where.liquidations = { none: {} };
            if (filters.paymentDate) {
                where.id = "impossible_pending_with_payment_date";
            }
        } else if (filters.status === 'LIQUIDATED') {
            where.liquidations = { some: liquidationConditions };
        } else {
            if (Object.keys(liquidationConditions).length > 0) {
                where.liquidations = { some: liquidationConditions };
            }
        }

        return await prisma.librengSakayTrip.findMany({
            where,
            include: {
                route: {
                    select: { routeName: true }
                },
                liquidations: {
                    include: {
                        user: { select: { name: true } },
                        trip: {
                            include: {
                                route: { select: { routeName: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { departureDate: "desc" },
            take: 200 // Limit results for performance
        });
    } catch (error: any) {
        console.error("Search Trips Error:", error.message);
        throw error;
    }
}

