'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createRealProperty(prevState: any, formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    await prisma.realProperty.create({
      data: {
        pin: formData.get("pin") as string,
        owner: formData.get("owner") as string,
        // These were missing and caused the error:
        taxdecnumber: formData.get("taxdecnumber") as string,
        tctOct: formData.get("tctOct") as string,
        location: formData.get("location") as string,
        lotNumber: formData.get("lotNumber") as string,

        // Numbers/Decimals
        area: Number(formData.get("area")),
        marketValue: Number(formData.get("marketValue")),

        // Relation
        userId: session.user.id
      }
    });

    revalidatePath("/realproperty");
    return { success: true, message: "Property created successfully!" };
  } catch (error) {
    console.error("Create Error:", error);
    return { success: false, message: "Failed to save property." };
  }
}

export async function getRealProperties() {
  try {
    const properties = await prisma.realProperty.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map through the results to convert Decimal to Number (or String)
    return properties.map(property => ({
      ...property,
      area: Number(property.area), // Converts Decimal to a plain number
      marketValue: Number(property.marketValue), // Converts Decimal to a plain number
    }))

  } catch (error) {
    console.error('Error fetching real properties:', error)
    return []
  }
}