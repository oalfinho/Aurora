import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

export type LocalReport = {
  id: string;
  region: string;
  category: string;
  period: string;
  month: string;
  status: "pending";
};

const reportsPath = path.join(process.cwd(), "data", "reports.json");

async function readReports(): Promise<LocalReport[]> {
  try {
    const contents = await readFile(reportsPath, "utf8");
    const parsed: unknown = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed as LocalReport[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function saveReport(report: LocalReport): Promise<void> {
  const reports = await readReports();
  if (reports.some((item) => item.id === report.id)) return;
  await mkdir(path.dirname(reportsPath), {recursive: true});
  await writeFile(reportsPath, JSON.stringify([...reports, report], null, 2) + "\n", "utf8");
}
