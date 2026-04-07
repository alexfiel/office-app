import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../lib/generated/prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 2. Initialize Prisma with the URL directly to ensure it connects
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    // 3. Correct path to the CSV file (one level up from /prisma/)
    const filePath = path.resolve(__dirname, '../faaslist2026Current.csv');

    const SYSTEM_USER_ID = 'cmno3g5tv0000vhapvrz82d9j';

    if (!fs.existsSync(filePath)) {
        console.error(`File not found at: ${filePath}`);
        return;
    }

    const batchSize = 5000;
    let currentBatch: any[] = [];

    const parser = fs.createReadStream(filePath)
        .pipe(parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }));

    console.log("Started upload...");

    for await (const record of parser) {
        currentBatch.push({
            objid: record.objid,
            pin: record.pin,
            taxdecnumber: record.tdno,
            owner: record.owner_name,
            rputype: record.rputype,
            barangay: record.barangay,
            classcode: record.classcode,
            // Ensure these are explicitly null if empty
            lotNumber: record.cadastrallotno || null,
            blockNumber: record.blockno || null,
            surveyno: record.surveyno || null,
            tctOct: record.titleno || null,
            documentUrl: null,                // Explicitly set null for optional fields
            area: parseFloat(record.totalareasqm) || 0,
            marketValue: record.totalmv ? parseFloat(record.totalmv) : 0,
            userId: SYSTEM_USER_ID,
        });

        if (currentBatch.length >= batchSize) {
            await prisma.realProperty.createMany({
                data: currentBatch,
                skipDuplicates: true,
            });
            console.log(`Uploaded batch of ${currentBatch.length} records`);
            currentBatch = [];
        }
    }

    if (currentBatch.length > 0) {
        await prisma.realProperty.createMany({
            data: currentBatch,
            skipDuplicates: true,
        });
        console.log(`Uploaded final batch of ${currentBatch.length} records`);
    }

    console.log("Upload complete!");
}

main()
    .catch((e) => {
        console.error("Critical Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
