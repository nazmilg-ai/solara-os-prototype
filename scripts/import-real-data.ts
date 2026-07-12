/**
 * CLI wrapper for the real-data import — see src/lib/import-real-data.ts for
 * the actual logic (shared with the Admin > Import "Full Data Refresh"
 * button, so a manual run and the in-app button behave identically).
 *
 * Run with: npm run import:real
 */
import path from "path";
import { PrismaClient } from "@prisma/client";
import { importRealData } from "../src/lib/import-real-data";

const prisma = new PrismaClient();
const ROOT = path.resolve(__dirname, "..");

importRealData(prisma, ROOT)
  .then((report) => {
    console.log("Import complete:");
    console.log(JSON.stringify(report, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
