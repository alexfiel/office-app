"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getFundTypes() {
  try {
    const fundTypes = await prisma.fundType.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: fundTypes };
  } catch (error) {
    console.error("Error fetching fund types:", error);
    return { success: false, error: "Failed to fetch fund types." };
  }
}

export async function createFundType(data: { name: string; code: string }) {
  try {
    const newFundType = await prisma.fundType.create({
      data: {
        name: data.name,
        code: data.code,
      },
    });
    revalidatePath("/cashier/settings");
    return { success: true, data: newFundType };
  } catch (error) {
    console.error("Error creating fund type:", error);
    return { success: false, error: "Failed to create fund type." };
  }
}

export async function getCollectionCategories() {
  try {
    const categories = await prisma.collectionCategory.findMany({
      include: {
        fundType: true,
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching collection categories:", error);
    return { success: false, error: "Failed to fetch collection categories." };
  }
}

export async function createCollectionCategory(data: {
  name: string;
  code: string;
  fundTypeId: string;
}) {
  try {
    const newCategory = await prisma.collectionCategory.create({
      data: {
        name: data.name,
        code: data.code,
        fundTypeId: data.fundTypeId,
      },
    });
    revalidatePath("/cashier/settings");
    return { success: true, data: newCategory };
  } catch (error) {
    console.error("Error creating collection category:", error);
    return { success: false, error: "Failed to create collection category." };
  }
}

// ----------------------------------------------------------------------
// EDIT & DELETE ACTIONS (ADMIN ONLY)
// ----------------------------------------------------------------------

import { auth } from "@/auth";

export async function editFundType(id: string, data: { name: string; code: string }) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") return { success: false, error: "Unauthorized." };

    const updated = await prisma.fundType.update({
      where: { id },
      data: { name: data.name, code: data.code },
    });
    revalidatePath("/cashier/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error editing fund type:", error);
    return { success: false, error: "Failed to edit fund type." };
  }
}

export async function deleteFundType(id: string) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") return { success: false, error: "Unauthorized." };

    // Check if there are linked categories
    const linkedCategories = await prisma.collectionCategory.count({
      where: { fundTypeId: id },
    });

    if (linkedCategories > 0) {
      return { success: false, error: "Cannot delete Fund Type because it is being used by existing Collection Categories." };
    }

    await prisma.fundType.delete({ where: { id } });
    revalidatePath("/cashier/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting fund type:", error);
    return { success: false, error: "Failed to delete fund type." };
  }
}

export async function editCollectionCategory(
  id: string,
  data: { name: string; code: string; fundTypeId: string }
) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") return { success: false, error: "Unauthorized." };

    const updated = await prisma.collectionCategory.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        fundTypeId: data.fundTypeId,
      },
    });
    revalidatePath("/cashier/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error editing collection category:", error);
    return { success: false, error: "Failed to edit collection category." };
  }
}

export async function deleteCollectionCategory(id: string) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") return { success: false, error: "Unauthorized." };

    // Check if there are linked collection items
    const linkedItems = await prisma.collectionItem.count({
      where: { collectionCategoryId: id },
    });

    if (linkedItems > 0) {
      return { success: false, error: "Cannot delete Collection Category because it is being used in existing Collections." };
    }

    await prisma.collectionCategory.delete({ where: { id } });
    revalidatePath("/cashier/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting collection category:", error);
    return { success: false, error: "Failed to delete collection category." };
  }
}
