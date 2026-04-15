// lib/get-dashboard-stats.ts
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function getDashboardStats() {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // 1. Get the current budget for the year/month
    const budget = await prisma.librengSakayBudget.findFirst({
        where: { year: now.getFullYear() }
    });

    // 2. Get total passengers served (from all trips)
    const paxCount = await prisma.librengSakayTrip.aggregate({
        where: { departureDate: { gte: start, lte: end } },
        _sum: { numberofPax: true }
    });

    // 3. Get total amount liquidated (actual money spent/paid)
    const totalSpent = await prisma.librengSakayLiquidation.aggregate({
        _sum: { amount: true }
    });

    const spentAmount = totalSpent._sum.amount || 0;
    const initialBudget = budget?.totalBudget || 0;

    return {
        totalPax: paxCount._sum.numberofPax || 0,
        totalSpent: spentAmount,
        runningBalance: initialBudget - spentAmount,
        budgetUtilization: (spentAmount / initialBudget) * 100,
        initialBudget
    };
}