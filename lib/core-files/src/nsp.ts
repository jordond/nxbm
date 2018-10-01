import { getDataDir } from "@nxbm/core";
import { FileParseOptions } from "@nxbm/types";
import { open, outputJSON, stat } from "fs-extra";
import { join } from "path";

import { File } from "./parser/models/File";
import { PFS0Entry } from "./parser/models/PFS0Entry";
import { PFS0Header } from "./parser/models/PFS0Header";
import { extractXml, findEntryXml } from "./parser/xml";

export async function isNSP() {
  // noop
}

export async function parseNSP(
  nspPath: string,
  options: FileParseOptions
): Promise<File> {
  const fd = await open(nspPath, "r");
  const stats = await stat(nspPath);

  const nspData = new File({
    filepath: nspPath,
    totalSizeBytes: stats.size,
    carttype: "eshop"
  });

  const pfs0Header = await PFS0Header.create(fd);
  // console.log(pfs0Header.toString());
  if (!pfs0Header.isValid()) {
    throwInvalidMagic(nspData, pfs0Header.magic);
  }

  const pfs0Entries: PFS0Entry[] = await pfs0Header.getPFS0Entries();
  if (pfs0Entries.length) {
    // pfs0Entries.forEach(x => console.log(x.toString()));
  }
  const controlEntry = findEntryXml(pfs0Entries);
  if (!controlEntry) {
    throw createParseError("Unable to find .cnmt.xml");
  }

  const nspXml = await extractXml(controlEntry, pfs0Header);

  return nspData;
}

function throwInvalidMagic(data: File, magic: string) {
  throw createParseError(
    `${data.filenameWithExt} => Invalid 'magic' header: ${magic}`
  );
}

function createParseError(reason: string) {
  throw new Error(`Unable to parse NSP: ${reason}`);
}
