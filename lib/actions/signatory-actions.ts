"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { DEFAULT_HEAD_OF_OFFICE } from "@/lib/signatories";

// Returns the active Head of Office signatory with fallback
export async function getActiveHeadOfOfficeSignatory() {
  try {
    const activeSignatory = await prisma.officeSignature.findFirst({
      where: {
        isHeadOfOffice: true,
        isActive: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (activeSignatory) {
      return { success: true, data: activeSignatory };
    }

    // If there is any Head of Office signatory, pick the latest
    const fallbackSignatory = await prisma.officeSignature.findFirst({
      where: { isHeadOfOffice: true },
      orderBy: { updatedAt: "desc" },
    });

    if (fallbackSignatory) {
      return { success: true, data: fallbackSignatory };
    }

    // Default hardcoded fallback for Tagbilaran City Treasurer
    return { success: true, data: DEFAULT_HEAD_OF_OFFICE };
  } catch (error: unknown) {
    console.error("Error fetching active Head of Office signatory:", error);
    return { success: true, data: DEFAULT_HEAD_OF_OFFICE };
  }
}

// Returns all configured signatories
export async function getAllSignatories() {
  try {
    const signatories = await prisma.officeSignature.findMany({
      orderBy: [
        { isActive: "desc" },
        { updatedAt: "desc" },
      ],
    });
    return { success: true, data: signatories };
  } catch (error: unknown) {
    console.error("Error fetching signatories:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch signatories.";
    return { success: false, error: message };
  }
}

// Create a new signatory (Admin only)
export async function createSignatory(data: {
  name: string;
  designation: string;
  office?: string;
  signatureUrl?: string;
  isHeadOfOffice?: boolean;
  isActive?: boolean;
}) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    if (!data.name?.trim() || !data.designation?.trim()) {
      return { success: false, error: "Name and designation are required." };
    }

    const isHeadOfOffice = data.isHeadOfOffice ?? true;
    const isActive = data.isActive ?? true;

    // If setting as active Head of Office, deactivate existing active head of office signatories
    if (isHeadOfOffice && isActive) {
      await prisma.officeSignature.updateMany({
        where: { isHeadOfOffice: true, isActive: true },
        data: { isActive: false },
      });
    }

    const newSignatory = await prisma.officeSignature.create({
      data: {
        name: data.name.trim(),
        designation: data.designation.trim(),
        office: data.office?.trim() || "Office of the City Treasurer",
        signatureUrl: data.signatureUrl || "",
        isHeadOfOffice,
        isActive,
      },
    });

    revalidatePath("/admin/signatories");
    revalidatePath("/newTransferTax");

    return { success: true, data: newSignatory };
  } catch (error: unknown) {
    console.error("Error creating signatory:", error);
    const message = error instanceof Error ? error.message : "Failed to create signatory.";
    return { success: false, error: message };
  }
}

// Update existing signatory (Admin only)
export async function updateSignatory(
  id: string,
  data: {
    name?: string;
    designation?: string;
    office?: string;
    signatureUrl?: string;
    isHeadOfOffice?: boolean;
    isActive?: boolean;
  }
) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    const existing = await prisma.officeSignature.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Signatory not found." };
    }

    const isHeadOfOffice = data.isHeadOfOffice !== undefined ? data.isHeadOfOffice : existing.isHeadOfOffice;
    const isActive = data.isActive !== undefined ? data.isActive : existing.isActive;

    // If setting as active Head of Office, deactivate other active heads of office
    if (isHeadOfOffice && isActive) {
      await prisma.officeSignature.updateMany({
        where: {
          id: { not: id },
          isHeadOfOffice: true,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const updated = await prisma.officeSignature.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.designation ? { designation: data.designation.trim() } : {}),
        ...(data.office !== undefined ? { office: data.office.trim() } : {}),
        ...(data.signatureUrl !== undefined ? { signatureUrl: data.signatureUrl } : {}),
        isHeadOfOffice,
        isActive,
      },
    });

    revalidatePath("/admin/signatories");
    revalidatePath("/newTransferTax");

    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Error updating signatory:", error);
    const message = error instanceof Error ? error.message : "Failed to update signatory.";
    return { success: false, error: message };
  }
}

// Set a signatory as the active Head of Office (Admin only)
export async function setActiveHeadOfOffice(id: string) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    // Deactivate all head of office signatories
    await prisma.officeSignature.updateMany({
      where: { isHeadOfOffice: true },
      data: { isActive: false },
    });

    // Activate selected signatory and ensure isHeadOfOffice is true
    const updated = await prisma.officeSignature.update({
      where: { id },
      data: {
        isActive: true,
        isHeadOfOffice: true,
      },
    });

    revalidatePath("/admin/signatories");
    revalidatePath("/newTransferTax");

    return { success: true, data: updated };
  } catch (error: unknown) {
    console.error("Error setting active Head of Office:", error);
    const message = error instanceof Error ? error.message : "Failed to set active Head of Office.";
    return { success: false, error: message };
  }
}

// Delete a signatory (Admin only)
export async function deleteSignatory(id: string) {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    await prisma.officeSignature.delete({
      where: { id },
    });

    revalidatePath("/admin/signatories");
    revalidatePath("/newTransferTax");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting signatory:", error);
    const message = error instanceof Error ? error.message : "Failed to delete signatory.";
    return { success: false, error: message };
  }
}

// Seed default City Treasurer signatory if none exists (Admin only)
export async function seedDefaultHeadOfOffice() {
  try {
    const session = await auth();
    const role = (session?.user as { role?: string })?.role;
    if (!session?.user || role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin privileges required." };
    }

    const count = await prisma.officeSignature.count();
    if (count > 0) {
      return { success: false, error: "Signatories already exist in database." };
    }

    const created = await prisma.officeSignature.create({
      data: {
        name: DEFAULT_HEAD_OF_OFFICE.name,
        designation: DEFAULT_HEAD_OF_OFFICE.designation,
        office: DEFAULT_HEAD_OF_OFFICE.office,
        signatureUrl: "",
        isHeadOfOffice: true,
        isActive: true,
      },
    });

    revalidatePath("/admin/signatories");
    revalidatePath("/newTransferTax");

    return { success: true, data: created };
  } catch (error: unknown) {
    console.error("Error seeding default signatory:", error);
    const message = error instanceof Error ? error.message : "Failed to seed default signatory.";
    return { success: false, error: message };
  }
}
