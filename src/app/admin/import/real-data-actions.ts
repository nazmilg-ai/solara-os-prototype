"use server";

import { prisma } from "@/lib/prisma";
import { importRealData, RealDataImportReport } from "@/lib/import-real-data";
import { revalidatePath } from "next/cache";

export async function runRealDataImport(): Promise<
  { ok: true; report: RealDataImportReport } | { ok: false; error: string }
> {
  try {
    // process.cwd() is the project root in a deployed Next.js server, same
    // place the CSVs live at the repo root.
    const report = await importRealData(prisma, process.cwd());
    revalidatePath("/admin/catalogue");
    revalidatePath("/quotes/new");
    return { ok: true, report };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
