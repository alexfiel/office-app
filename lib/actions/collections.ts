"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createCollection(data: {
  date: Date;
  items: { categoryId: string; amount: number }[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const { date, items } = data;
    const userId = session.user.id;

    // Validate inputs
    if (!items || items.length === 0) {
      return { success: false, error: "At least one category must be selected and filled." };
    }

    let baseAmount = 0;
    const parsedItems = items.map(item => ({
      ...item,
      amount: Number(item.amount)
    }));

    for (const item of parsedItems) {
      if (isNaN(item.amount) || item.amount <= 0) {
        return { success: false, error: "All amounts must be valid numbers greater than zero." };
      }
      if (item.amount > 1000000000) {
        return { success: false, error: "Amount exceeds maximum allowed value (1 Billion)." };
      }
      baseAmount += item.amount;
    }

    const totalAmount = baseAmount; // Compute total from all items

    // Generate Control No: CTO-COL-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const prefix = `CTO-COL-${currentYear}-`;

    // Find the latest collection for this year
    const lastCollection = await prisma.collections.findFirst({
      where: {
        controlNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        controlNo: "desc",
      },
    });

    let nextSequence = 1;
    if (lastCollection && lastCollection.controlNo) {
      const lastSeqStr = lastCollection.controlNo.split("-").pop();
      const lastSeq = parseInt(lastSeqStr || "0", 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    const controlNo = `${prefix}${nextSequence.toString().padStart(4, "0")}`;

    const newCollection = await prisma.collections.create({
      data: {
        controlNo,
        date,
        amount: baseAmount,
        totalAmount,
        userId,
        collectionItems: {
          create: parsedItems.map((item) => ({
            collectionCategoryId: item.categoryId,
            amount: item.amount,
          })),
        },
      },
      include: {
        collectionItems: true,
      },
    });

    // Serialize Decimal to number for Next.js Client Boundary
    const serializedData = {
      ...newCollection,
      amount: Number(newCollection.amount),
      totalAmount: Number(newCollection.totalAmount),
      collectionItems: newCollection.collectionItems.map(item => ({
        ...item,
        amount: Number(item.amount)
      }))
    };

    revalidatePath("/cashier/collections");
    return { success: true, data: serializedData };
  } catch (error) {
    console.error("Error creating collection:", error);
    return { success: false, error: "Failed to save the collection." };
  }
}

export interface CollectionFilters {
  filterType?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
  week?: string;
  quarter?: string;
  unconsolidatedOnly?: boolean;
}

export async function getRecentCollections(filters?: CollectionFilters) {
  try {
    let whereClause: any = {};
    let takeClause: number | undefined = 50;

    if (filters?.unconsolidatedOnly) {
      whereClause.dailyCollectionId = null;
    }

    if (filters?.filterType) {
      let gte: Date | undefined;
      let lte: Date | undefined;

      switch (filters.filterType) {
        case 'single':
          if (filters.date) {
            gte = new Date(filters.date);
            gte.setHours(0, 0, 0, 0);
            lte = new Date(filters.date);
            lte.setHours(23, 59, 59, 999);
          }
          break;
        case 'range':
          if (filters.startDate && filters.endDate) {
            gte = new Date(filters.startDate);
            gte.setHours(0, 0, 0, 0);
            lte = new Date(filters.endDate);
            lte.setHours(23, 59, 59, 999);
          }
          break;
        case 'week':
          if (filters.week) {
            const [yearStr, weekNumStr] = filters.week.split("-W");
            const year = parseInt(yearStr, 10);
            const week = parseInt(weekNumStr, 10);
            const simple = new Date(year, 0, 1 + (week - 1) * 7);
            const dow = simple.getDay();
            const ISOweekStart = simple;
            if (dow <= 4)
              ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else
              ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
            
            gte = new Date(ISOweekStart);
            gte.setHours(0, 0, 0, 0);
            lte = new Date(ISOweekStart);
            lte.setDate(lte.getDate() + 6);
            lte.setHours(23, 59, 59, 999);
          }
          break;
        case 'month':
          if (filters.month) {
            // month is in YYYY-MM format
            const [y, m] = filters.month.split('-');
            gte = new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0);
            lte = new Date(Number(y), Number(m), 0, 23, 59, 59, 999);
          }
          break;
        case 'quarter':
          if (filters.quarter && filters.year) {
            const year = Number(filters.year);
            const q = Number(filters.quarter);
            const startMonth = (q - 1) * 3;
            const endMonth = startMonth + 2;
            gte = new Date(year, startMonth, 1, 0, 0, 0, 0);
            lte = new Date(year, endMonth + 1, 0, 23, 59, 59, 999);
          }
          break;
        case 'year':
          if (filters.year) {
            gte = new Date(Number(filters.year), 0, 1, 0, 0, 0, 0);
            lte = new Date(Number(filters.year), 11, 31, 23, 59, 59, 999);
          }
          break;
      }

      if (gte && lte) {
        whereClause.date = { gte, lte };
        // Disable limit if any valid filter is applied
        takeClause = undefined;
      }
    }

    const collections = await prisma.collections.findMany({
      where: whereClause,
      take: takeClause,
      orderBy: { date: "desc" },
      include: {
        collectionItems: {
          include: {
            collectionCategory: {
              include: {
                fundType: true,
              },
            },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });
    const serializedCollections = collections.map((col) => ({
      ...col,
      amount: Number(col.amount),
      totalAmount: Number(col.totalAmount),
      collectionItems: col.collectionItems.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    }));

    return { success: true, data: serializedCollections };
  } catch (error) {
    console.error("Error fetching collections:", error);
    return { success: false, error: "Failed to load recent collections." };
  }
}

export async function deleteCollection(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin rights required." };
    }

    await prisma.collections.delete({
      where: { id },
    });

    revalidatePath("/cashier/collections");
    return { success: true };
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { success: false, error: "Failed to delete collection." };
  }
}

export async function editCollection(
  id: string,
  data: {
    date: Date;
    items: { categoryId: string; amount: number }[];
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin rights required." };
    }

    const { date, items } = data;

    if (!items || items.length === 0) {
      return { success: false, error: "At least one category must be selected and filled." };
    }

    let baseAmount = 0;
    const parsedItems = items.map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

    for (const item of parsedItems) {
      if (isNaN(item.amount) || item.amount <= 0) {
        return {
          success: false,
          error: "All amounts must be valid numbers greater than zero.",
        };
      }
      if (item.amount > 1000000000) {
        return {
          success: false,
          error: "Amount exceeds maximum allowed value (1 Billion).",
        };
      }
      baseAmount += item.amount;
    }

    const totalAmount = baseAmount;

    // Use a transaction to safely overwrite items
    const updatedCollection = await prisma.$transaction(async (tx) => {
      // 1. Delete all existing items
      await tx.collectionItem.deleteMany({
        where: { collectionId: id },
      });

      // 2. Update collection and recreate items
      return await tx.collections.update({
        where: { id },
        data: {
          date,
          amount: baseAmount,
          totalAmount,
          collectionItems: {
            create: parsedItems.map((item) => ({
              collectionCategoryId: item.categoryId,
              amount: item.amount,
            })),
          },
        },
        include: {
          collectionItems: true,
        },
      });
    });

    const serializedData = {
      ...updatedCollection,
      amount: Number(updatedCollection.amount),
      totalAmount: Number(updatedCollection.totalAmount),
      collectionItems: updatedCollection.collectionItems.map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    };

    revalidatePath("/cashier/collections");
    return { success: true, data: serializedData };
  } catch (error) {
    console.error("Error editing collection:", error);
    return { success: false, error: "Failed to update the collection." };
  }
}
