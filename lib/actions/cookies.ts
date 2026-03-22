"use server"

import { cookies } from "next/headers"

/**
 * Saves the selected property details into a session cookie
 * that can be read by other parts of the application.
 */
export async function savePropertyCookieAction(property: {
  id: string
  taxdecnumber: string
  pin: string
  lotNumber: string
  owner: string
  location: string
  area: number
  marketValue: number
  tctOct: string

}) {
  try {
    const cookieStore = await cookies()
    cookieStore.set("selectedProperty", JSON.stringify(property), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Set to expire in 7 days (or session length)
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to save property cookie:", error)
    return { success: false, error: "Failed to save selection" }
  }
}

/**
 * Retrieves the currently selected property from cookies
 */
export async function getSelectedPropertyCookie() {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("selectedProperty")

    if (cookie?.value) {
      return JSON.parse(cookie.value) as {
        id: string
        taxdecnumber: string
        pin: string
        lotNumber: string
        owner: string
        location: string
        area: number
        marketValue: number
        tctOct: string
      }
    }

    return null
  } catch (error) {
    console.error("Failed to parse property cookie:", error)
    return null
  }
}

/**
 * Clears the selected property cookie
 */
export async function clearPropertyCookieAction() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("selectedProperty")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}
