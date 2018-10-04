import {
  ContentType,
  FileParseOptions,
  IFileData,
  NSPContentType,
  NSPXML
} from "@nxbm/types";
import { ensureOpenRead } from "@nxbm/utils";
import { open, remove, stat } from "fs-extra";

import { getTempMetaDir } from "./parser/cnmt";
import { getFirmwareFromString } from "./parser/firmware";
import { File } from "./parser/models/File";
import { NSP } from "./parser/models/NSP";
import { PFS0Entry } from "./parser/models/PFS0Entry";
import { PFS0Header } from "./parser/models/PFS0Header";
import {
  parseRomFSInfo,
  processNCAInfo,
  unpackAndProcessTargetNCA,
  writeNCATargetRomFS
} from "./parser/nca";
import { extractXml, findEntryXml, getBaseGameTitleId } from "./parser/xml";

export async function isNSP(path: string) {
  try {
    const fd = await ensureOpenRead(path);
    const header = await PFS0Header.create(fd);
    return header.isValid();
  } catch (error) {
    return false;
  }
}

export async function parseNSP(
  nspPath: string,
  { outputDir, cleanup = true }: FileParseOptions
): Promise<File> {
  const fd = await open(nspPath, "r");

  // Check if it is a valid NSP
  const pfs0Header = await PFS0Header.create(fd);
  if (!pfs0Header.isValid()) {
    throw createParseError(
      `${nspPath} => Invalid 'magic' header: ${pfs0Header.magic}`
    );
  }

  // Get all the pfs0 entries, then find the the info xml
  const pfs0Entries: PFS0Entry[] = await pfs0Header.getPFS0Entries();
  const controlEntry = findEntryXml(pfs0Entries);
  if (!controlEntry) {
    throw createParseError("Unable to find .cnmt.xml");
  }

  // Extract and parse the XML
  const nspXml = await extractXml(controlEntry, pfs0Header);
  const titleId = nspXml.Id;
  const titleIDBaseGame = getBaseGameTitleId(nspXml);

  // Find the NCA containing icon and language data
  const targetNCA = findNCATarget(nspXml, pfs0Entries);
  if (!targetNCA) {
    throw createParseError("Unable to find the target NCA");
  }

  // Write the NCA's romfs to the disk
  const romfsDir = await writeNCATargetRomFS(pfs0Header, targetNCA, titleId);

  // If it isn't a DLC, grab meta-data from the romfs
  let ncaInfo: Partial<IFileData> = {};
  if (nspXml.Type !== ContentType.DLC) {
    const info = await unpackAndProcessTargetNCA(romfsDir);
    const result = await processNCAInfo(info, outputDir, titleIDBaseGame);

    ncaInfo = result;
  }

  const stats = await stat(nspPath);
  const miscInfo = await parseRomFSInfo(romfsDir);

  if (cleanup) {
    await remove(getTempMetaDir(titleId));
  }

  return new NSP({
    filepath: nspPath,
    totalSizeBytes: stats.size,
    usedSizeBytes: stats.size,
    carttype: "eshop",
    firmware: getFirmwareFromString(nspXml.RequiredSystemVersion),
    titleID: nspXml.Id,
    titleIDBaseGame: getBaseGameTitleId(nspXml),
    contentType: nspXml.Type,
    version: nspXml.Version,
    ...ncaInfo,
    ...miscInfo
  });
}

function findNCATarget(xml: NSPXML, entries: PFS0Entry[]) {
  const ncaTarget = findNCATargetString(xml);
  return entries.find(entry => entry.name === ncaTarget);
}

function findNCATargetString(xml: NSPXML) {
  if (xml.Type !== ContentType.DLC) {
    const control = xml.Content.find(x => x.Type === NSPContentType.CONTROL);
    return control ? `${control.Id}.nca` : "";
  }

  const meta = xml.Content.find(x => x.Type === NSPContentType.META);
  return meta ? `${meta.Id}.cnmt.nca` : "";
}

function createParseError(reason: string) {
  throw new Error(`Unable to parse NSP: ${reason}`);
}
