import {mkdir, readFile, writeFile, link, unlink} from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";

export type LocalReport = {
  id: string;
  region: string;
  category: string;
  period: string;
  month: string;
  status: "pending";
};

export async function saveReport(report: LocalReport): Promise<void> {
  // One immutable file per UUID: simultaneous requests never overwrite each other.
  const directory = path.join(process.cwd(), "data", "reports");
  await mkdir(directory, {recursive: true});
  // Preserve idempotency for records created by previous versions.
  try {
    const legacy: LocalReport[] = JSON.parse(await readFile(path.join(process.cwd(), "data", "reports.json"), "utf8"));
    if (legacy.some((item) => item.id === report.id)) return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const temporary = path.join(directory, `.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(report) + "\n", {encoding: "utf8", flag: "wx", mode: 0o600});
    try {
      // Publish only the complete file; link is atomic and never replaces an ID.
      await link(temporary, path.join(directory, `${report.id}.json`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  } finally {
    await unlink(temporary).catch(() => {});
  }
}
