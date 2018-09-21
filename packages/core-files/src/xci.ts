import { readByByte, readNBytes } from "@nxbm/utils";
import BlueBird, { map as mapPromise } from "bluebird";
import { open, stat } from "fs-extra";

import { gatherExtraInfo } from "./parser/cnmt";
import { File } from "./parser/models/File";
import { FSEntry } from "./parser/models/FSEntry";
import { FSHeader } from "./parser/models/FSHeader";
import { XCIHeader } from "./parser/models/XCIHeader";
import {
  decryptNCAHeader,
  Detail,
  Details,
  getNCADetails
} from "./parser/secure";
import { findVersion } from "./parser/version";

export async function isXCI(path: string) {
  try {
    const fd = await open(path, "r");
    const header = new XCIHeader(await readNBytes(fd, 61440));
    return header.magic === "HEAD";
  } catch (error) {
    return false;
  }
}

/**
 * Parse a given XCI file
 * TODO - Add param for temp dir
 * @param xciPath Path to the XCI file
 * @param headerKey Header key to decrypt NCA
 * @param outputDir Directory to store the icons
 * @param cleanup Cleanup temporary files
 * @throws
 */
export async function parseXCI(
  xciPath: string,
  headerKey: string,
  outputDir: string,
  cleanup: boolean = true
): Promise<File> {
  const fd = await open(xciPath, "r");
  const stats = await stat(xciPath);

  const xciData = new File({
    filepath: xciPath,
    totalSizeBytes: stats.size,
    distributionType: "Cartridge",
    contentType: "Application"
  });

  const xciHeader = new XCIHeader(await readNBytes(fd, 61440));
  xciData.assign({
    usedSizeBytes: xciHeader.cardSize2 * 512 + 512,
    rawCartSize: xciHeader.cardSize1
  });

  const hfs0Header = new FSHeader(
    await readNBytes(fd, 16, xciHeader.hfs0Offset)
  );

  const hfs0Size = xciHeader.hfs0Offset + xciHeader.hfs0Size;
  const hsf0Entries: FSEntry[] = await getMainHFS0Entries(
    fd,
    xciHeader,
    hfs0Header
  );

  // Handle secure partition details
  const secureHFS0 = hsf0Entries.find(entry => entry.name === "secure");
  if (!secureHFS0) throw new Error("A Secure partition was not found!");

  // Gather information about the secure partition
  const secureDetails = await getSecureHFS0Details(fd, secureHFS0, hfs0Size);

  // Decrypt the NCA header
  const { offset } = getNCADetails(secureDetails);
  const ncaHeader = await decryptNCAHeader(xciPath, headerKey, offset, cleanup);
  xciData.assign({
    titleIDRaw: ncaHeader.rawTitleID,
    sdkVersion: ncaHeader.formatSDKVersion(),
    masterKeyRevisionRaw: ncaHeader.masterKeyRev
  });

  // Get detailed information containe in secure partition
  const filteredDetails = secureDetails.filter(
    detail => detail.size < 0x4e20000
  );
  const extraInfo = await gatherExtraInfo(
    fd,
    filteredDetails,
    ncaHeader.titleId(),
    outputDir,
    cleanup
  );
  xciData.assign(extraInfo);

  // Get the version number
  const updateHFS0 = hsf0Entries.find(entry => entry.name === "update");
  if (!updateHFS0) throw new Error("A update partition was not found");

  const updateHeader = await getHFS0Header(fd, updateHFS0, hfs0Size);
  const updateEntries = await getHFS0Entries(fd, updateHeader, hfs0Size);
  xciData.version = findVersion(updateEntries.map(x => x.name));

  return xciData;
}

function calcHFSOffset(offset: number, additional?: number): number {
  return offset + 16 + 64 * (additional !== undefined ? additional : 1);
}

function getMainHFS0Entries(file: number, xci: XCIHeader, hfs0: FSHeader) {
  return getHFS0Entries(file, hfs0, xci.hfs0Offset);
}

async function getHFS0Header(
  file: number,
  entry: FSEntry,
  hfs0Size: number
): Promise<FSHeader> {
  const offset = entry.offset + hfs0Size;
  return new FSHeader(await readNBytes(file, 16, offset));
}

function getHFS0Entries(
  file: number,
  fsHeader: FSHeader,
  startOffset: number
): BlueBird<FSEntry[]> {
  return mapPromise(Array(fsHeader.filecount), async (_, index) => {
    // Get entry
    const entryPosition = calcHFSOffset(startOffset, index);
    const entry = new FSEntry(await readNBytes(file, 64, entryPosition));

    // Get name
    const namePosition =
      calcHFSOffset(startOffset, fsHeader.filecount) + entry.namePtr;
    const charName = await readByByte(file, namePosition, num => num !== 0);
    entry.name = charName.toString();

    return entry;
  });
}

async function getSecureHFS0Details(
  file: number,
  rootEntry: FSEntry,
  hfs0Size: number
): Promise<Details> {
  const secureHeader = await getHFS0Header(file, rootEntry, hfs0Size);
  const secureEntries = await getHFS0Entries(
    file,
    secureHeader,
    rootEntry.offset + hfs0Size
  );

  // Iterate over the children in the secure partition and gather sizes and offsets
  return secureEntries.map<Detail>(entry => ({
    size: entry.size,
    name: entry.name,
    offset: calcSecureOffset(secureHeader, rootEntry, entry, hfs0Size)
  }));
}

function calcSecureOffset(
  header: FSHeader,
  root: FSEntry,
  child: FSEntry,
  hfs0Size: number
) {
  return (
    root.offset +
    child.offset +
    hfs0Size +
    16 +
    header.stringTableSize +
    header.filecount * 64
  );
}
