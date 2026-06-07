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
        
        // Ensure the uploads directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        // Generate a unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = file.name.split('.').pop() || 'pdf';
        const filename = `doc-${uniqueSuffix}.${extension}`;
        
        // Save the file
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        
        // Return the public URL
        const publicUrl = `/uploads/${filename}`;
        
        return { status: "success", url: publicUrl };

    } catch (error) {
        console.error("Error saving file:", error);
        return { error: "Failed to upload file" };
    }
}