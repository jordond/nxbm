import { stat } from "fs-extra";

import { File } from "./parser/models/File";

export async function parseXCI(
  nspPath: string
  // headerKey: string,
  // outputDir: string,
  // cleanup: boolean = true
): Promise<File> {
  // const fd = await open(nspPath, "r");
  const stats = await stat(nspPath);

  const nspData = new File({
    filepath: nspPath,
    totalSizeBytes: stats.size,
    carttype: "eshop"
  });

  return nspData;
}
