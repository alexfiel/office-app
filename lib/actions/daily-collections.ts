"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

export async function createDailyCollection(collectionIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const userId = session.user.id;

    if (!collectionIds || collectionIds.length === 0) {
      return { success: false, error: "No collections selected." };
    }

    // Fetch the selected collections to verify they exist and aren't already consolidated
    const collections = await prisma.collections.findMany({
      where: {
        id: { in: collectionIds },
        dailyCollectionId: null,
      },
      include: {
        collectionItems: true,
      }
    });

    if (collections.length !== collectionIds.length) {
      return { success: false, error: "Some collections are either already consolidated or invalid." };
    }

    // Compute totalAmount
    const totalAmount = collections.reduce((acc, col) => acc + Number(col.totalAmount), 0);
    // Let's assume totalDeposits is the same as totalAmount for now, or 0 if they input it later
    const totalDeposits = totalAmount;

    // Generate Control No: CTO-DCOL-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const prefix = `CTO-DCOL-${currentYear}-`;

    const lastDailyCollection = await prisma.dailyConsolidatedCollection.findFirst({
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
    if (lastDailyCollection && lastDailyCollection.controlNo) {
      const lastSeqStr = lastDailyCollection.controlNo.split("-").pop();
      const lastSeq = parseInt(lastSeqStr || "0", 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    const controlNo = `${prefix}${nextSequence.toString().padStart(4, "0")}`;

    // Create the DailyConsolidatedCollection and update the selected Collections within a transaction
    const newDailyCollection = await prisma.$transaction(async (tx) => {
      const dailyCollection = await tx.dailyConsolidatedCollection.create({
        data: {
          controlNo,
          date: new Date(),
          totalAmount: new Prisma.Decimal(totalAmount),
          totalDeposits: new Prisma.Decimal(totalDeposits),
          userId,
          collectionitemids: collectionIds,
        },
      });

      await tx.collections.updateMany({
        where: { id: { in: collectionIds } },
        data: { dailyCollectionId: dailyCollection.id },
      });

      return tx.dailyConsolidatedCollection.findUnique({
        where: { id: dailyCollection.id },
        include: {
          collections: {
            include: {
              collectionItems: {
                include: {
                  collectionCategory: {
                    include: {
                      fundType: true,
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    if (!newDailyCollection) {
      throw new Error("Failed to retrieve created daily collection.");
    }

    revalidatePath("/cashier/collections");
    return { success: true, data: serializeDailyCollection(newDailyCollection) };
  } catch (error) {
    console.error("Error creating daily collection:", error);
    return { success: false, error: "Failed to create daily consolidated collection." };
  }
}

export interface DailyCollectionFilters {
  filterType?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
}

export async function getDailyCollections(filters?: DailyCollectionFilters) {
  try {
    let whereClause = {};
    let takeClause: number | undefined = 50;

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
        case 'month':
          if (filters.month) {
            const [y, m] = filters.month.split('-');
            gte = new Date(Number(y), Number(m) - 1, 1, 0, 0, 0, 0);
            lte = new Date(Number(y), Number(m), 0, 23, 59, 59, 999);
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
        whereClause = {
          date: { gte, lte }
        };
        takeClause = undefined;
      }
    }

    const dailyCollections = await prisma.dailyConsolidatedCollection.findMany({
      where: whereClause,
      take: takeClause,
      orderBy: { date: "desc" },
      include: {
        collections: {
          include: {
            collectionItems: {
              include: {
                collectionCategory: {
                  include: {
                    fundType: true,
                    collectionGroup: true,
                  }
                }
              }
            }
          }
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const serialized = dailyCollections.map(serializeDailyCollection);

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Error fetching daily collections:", error);
    return { success: false, error: "Failed to load daily collections." };
  }
}

function serializeDailyCollection(col: any) {
  return {
    ...col,
    totalAmount: Number(col.totalAmount),
    totalDeposits: Number(col.totalDeposits),
    collections: col.collections?.map((c: any) => ({
      ...c,
      amount: Number(c.amount),
      totalAmount: Number(c.totalAmount),
      collectionItems: c.collectionItems?.map((item: any) => ({
        ...item,
        amount: Number(item.amount),
      })) || [],
    })) || [],
  };
}
