import { ContentType, FileParseOptions, IFile } from "@nxbm/types";
import { ensureOpenRead, readNBytes } from "@nxbm/utils";
import { stat } from "fs-extra";

import { gatherExtraInfo } from "./parser/cnmt";
import { File } from "./parser/models/File";
import { HFS0Entry } from "./parser/models/HFS0Entry";
import { HFS0Header } from "./parser/models/HFS0Header";
import { XCI } from "./parser/models/XCI";
import { XCIHeader } from "./parser/models/XCIHeader";
import { decryptNCAHeader, getNCADetails } from "./parser/secure";
import { findVersion } from "./parser/version";

export async function isXCI(path: string) {
  try {
    const fd = await ensureOpenRead(path);
    const header = new XCIHeader(await readNBytes(fd, 61440));
    return header.isValid();
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
  options: FileParseOptions
): Promise<File> {
  const fd = await ensureOpenRead(xciPath);

  // Get root HFS0 details
  const xciHeader = new XCIHeader(await readNBytes(fd, 61440));
  const header = await HFS0Header.create(fd, xciHeader.hfs0Offset);
  const entries = await header.getHFS0Entries(xciHeader.hfs0Offset);
  const offset = xciHeader.getHFS0Offset();

  // Get the detailed info
  const version = await getXCIVersion(fd, entries, offset);
  const secureInfo = await processSecurePartition(
    fd,
    xciPath,
    entries,
    offset,
    options
  );

  const stats = await stat(xciPath);
  return new XCI({
    version,
    distributionType: "Cartridge",
    contentType: ContentType.APPLICATION,
    filepath: xciPath,
    totalSizeBytes: stats.size,
    usedSizeBytes: xciHeader.calculateUsedSize(),
    rawCartSize: xciHeader.cardSize1,
    ...secureInfo
  });
}

async function processSecurePartition(
  fd: number,
  xciPath: string,
  hfs0Entries: HFS0Entry[],
  hfs0Offset: number,
  { headerKey, cleanup = true, outputDir }: FileParseOptions
): Promise<Partial<IFile>> {
  const secureEntry = hfs0Entries.find(entry => entry.name === "secure");
  if (!secureEntry) throw new Error("A Secure partition was not found!");

  // Gather information about the secure partition
  const secureStartOffset = secureEntry.offset + hfs0Offset;
  const secureHeader = await HFS0Header.create(fd, secureStartOffset);
  const secureDetails = await secureHeader.getSecurePartionDetails(
    secureStartOffset
  );

  // Decrypt the NCA header
  const { offset } = getNCADetails(secureDetails);
  const ncaHeader = await decryptNCAHeader(xciPath, headerKey, offset, cleanup);

  // Get detailed information contained in secure partition
  const filteredDetails = secureDetails.filter(it => it.size < 0x4e20000);
  const extraInfo = await gatherExtraInfo(
    fd,
    filteredDetails,
    ncaHeader.titleId(),
    outputDir,
    cleanup
  );

  return {
    titleID: ncaHeader.titleId(),
    titleIDBaseGame: ncaHeader.titleId(),
    sdkVersion: ncaHeader.formatSDKVersion(),
    masterKeyRevision: ncaHeader.formatMasterKey(),
    ...extraInfo
  };
}

async function getXCIVersion(
  fd: number,
  hfs0Entries: HFS0Entry[],
  hfs0Offset: number
) {
  const entry = hfs0Entries.find(hfs0 => hfs0.name === "update");
  if (!entry) throw new Error("A update partition was not found");

  const offset = entry.offset + hfs0Offset;
  const header = await HFS0Header.create(fd, offset);
  const entries = await header.getHFS0Entries(hfs0Offset);

  return findVersion(entries.map(x => x.name));
}
