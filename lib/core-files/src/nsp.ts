import {
  FileParseOptions,
  FileType,
  NSPContentType,
  NSPXML
} from "@nxbm/types";
import { open, stat } from "fs-extra";
import { join } from "path";

import { getInfo } from "./hactool";
import { getFirmwareFromString } from "./parser/firmware";
import { File } from "./parser/models/File";
import { PFS0Entry } from "./parser/models/PFS0Entry";
import { PFS0Header } from "./parser/models/PFS0Header";
import {
  processNCAInfo,
  unpackAndProcessTargetNCA,
  writeNCATargetRomFS
} from "./parser/nca";
import { UnpackTypes } from "./parser/unpack";
import { extractXml, findEntryXml, getBaseGameTitleId } from "./parser/xml";

export async function isNSP() {
  // noop
}

export async function parseNSP(
  nspPath: string,
  { outputDir, ...options }: FileParseOptions
): Promise<File> {
  const fd = await open(nspPath, "r");
  const stats = await stat(nspPath);

  const nspData = new File({
    filepath: nspPath,
    totalSizeBytes: stats.size,
    usedSizeBytes: stats.size,
    carttype: "eshop"
  });

  const pfs0Header = await PFS0Header.create(fd);
  if (!pfs0Header.isValid()) {
    throwInvalidMagic(nspData, pfs0Header.magic);
  }

  const pfs0Entries: PFS0Entry[] = await pfs0Header.getPFS0Entries();
  const controlEntry = findEntryXml(pfs0Entries);
  if (!controlEntry) {
    throw createParseError("Unable to find .cnmt.xml");
  }

  const nspXml = await extractXml(controlEntry, pfs0Header);
  nspData.firmware = getFirmwareFromString(nspXml.RequiredSystemVersion);
  nspData.titleID = nspXml.Id;
  nspData.titleIDBaseGame = getBaseGameTitleId(nspXml);
  nspData.contentType = nspXml.Type;
  nspData.version = nspXml.Version;

  const targetNCA = findNCATarget(nspXml, pfs0Entries);
  if (!targetNCA) {
    throw createParseError("Unable to find the target NCA");
  }

  const romfsDir = await writeNCATargetRomFS(
    pfs0Header,
    targetNCA,
    nspData.titleID
  );

  if (nspData.contentType !== FileType.DLC) {
    const info = await unpackAndProcessTargetNCA(romfsDir);
    const result = await processNCAInfo(
      info,
      outputDir,
      nspData.titleIDBaseGame
    );

    nspData.assign(result);
  } else {
    // Try to grab info about this NSP from it's parent (using titleid)
    // From gamedb
    // OR - from NSWDB
  }

  // Get remaining info from reading stdout from hactool
  const stdout = await getInfo(join(romfsDir, UnpackTypes.ROMFS));
  stdout
    .split("/n")
    .map(x => x.trim().replace(/ /g, ""))
    .forEach(x => console.log(x));
  // If clean enabled delete dir

  return nspData;
}

function findNCATarget(xml: NSPXML, entries: PFS0Entry[]) {
  const ncaTarget = findNCATargetString(xml);
  return entries.find(entry => entry.name === ncaTarget);
}

function findNCATargetString(xml: NSPXML) {
  if (xml.Type !== FileType.DLC) {
    const control = xml.Content.find(x => x.Type === NSPContentType.CONTROL);
    return control ? `${control.Id}.nca` : "";
  }

  const meta = xml.Content.find(x => x.Type === NSPContentType.META);
  return meta ? `${meta.Id}.cnmt.nca` : "";
}

function throwInvalidMagic(data: File, magic: string) {
  throw createParseError(
    `${data.filenameWithExt} => Invalid 'magic' header: ${magic}`
  );
}

function createParseError(reason: string) {
  throw new Error(`Unable to parse NSP: ${reason}`);
}
