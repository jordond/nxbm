import { FileParseOptions } from "@nxbm/types";
import { open, stat } from "fs-extra";

import { File } from "./parser/models/File";
import { PFS0Entry } from "./parser/models/PFS0Entry";
import { createPFS0Header, PFS0Header } from "./parser/models/PFS0Header";

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

  const pfs0Header = await createPFS0Header(fd);
  console.log(pfs0Header.toString());
  if (!pfs0Header.isValid()) {
    throwInvalidMagic(nspData, pfs0Header.magic);
  }

  const pfs0Entries: PFS0Entry[] = await pfs0Header.getPFS0Entries(fd);
  if (pfs0Entries.length) {
    pfs0Entries.forEach(x => console.log(x.toString()));
  }

  return nspData;
}

function throwInvalidMagic(data: File, magic: string) {
  throwParseError(
    `${data.filenameWithExt} => Invalid 'magic' header: ${magic}`
  );
}

function throwParseError(reason: string) {
  throw new Error(`Unable to parse NSP: ${reason}`);
}
