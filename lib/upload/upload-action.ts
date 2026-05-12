"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

export async function uploadFile(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
        return { error: "No file provided" }
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Str = buffer.toString("base64");
        const mimeType = file.type || "application/pdf";
        const dataUri = `data:${mimeType};base64,${base64Str}`;
        
        return { status: "success", url: dataUri };

    } catch (error) {
        console.error("Error encoding file:", error);
        return { error: "Failed to upload file" };
    }
}