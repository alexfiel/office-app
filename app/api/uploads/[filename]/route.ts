import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ filename: string }> }) {
    try {
        const { filename } = await params;
        const filePath = path.join(process.cwd(), "public", "uploads", filename);
        
        const fileBuffer = await fs.readFile(filePath);
        
        const ext = path.extname(filename).toLowerCase();
        let contentType = "application/octet-stream";
        if (ext === ".pdf") contentType = "application/pdf";
        else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
        else if (ext === ".png") contentType = "image/png";

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
            },
        });
    } catch (error) {
        return new NextResponse("File not found", { status: 404 });
    }
}
