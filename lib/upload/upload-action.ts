"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

export async function uploadFile(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
        return { error: "No file provided" }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // create a unique filename to prevent collision and security issues
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${path.parse(file.name).name}-${uniqueSuffix}${path.parse(file.name).ext}`;


    // upload-action.ts
    try {
        const uploadDir = path.join(process.cwd(), "public/uploads");
        await fs.mkdir(uploadDir, { recursive: true });

        await fs.writeFile(path.join(uploadDir, filename), buffer);
        revalidatePath("/upload");

        // Change fileUrl to url
        return { status: "success", url: `/uploads/${filename}` };

    } catch (error) {
        console.error("Error uploading file:", error);
        return { error: "Failed to upload file" };
    }
}