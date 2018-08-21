import BlueBird, { map as mapPromise } from "bluebird";
import { open, stat } from "fs-extra";

import { readByByte, readNBytes, readWriteByNBytes } from "../../util/buffer";
import { readRawKeyFile } from "../keys";
import { getGameDatabase } from "../nswdb";
import { File } from "./models/File";
import { FSEntry } from "./models/FSEntry";
import { FSHeader } from "./models/FSHeader";
import { decryptNCAHeader, Detail, Details, getNCADetails } from "./secure";
import { findVersion } from "./version";
import { XCIHeader } from "./XCIHeader";

const FILE =
  "/Users/jordondehoog/Downloads/switchsd/0003 - ARMS (World) (En,Ja,Fr,De,Es,It,Nl,Ru) [Trimmed].xci";

const KEYS_PATH = "/Users/jordondehoog/dev/nxbm/tmp/data/keys.txt";
const TEMP_META_OUT = "/Users/jordondehoog/dev/nxbm/tmp/meta";

async function testParseAndGrab(path: string) {
  const game = await parseXCI(path);
  const db = await getGameDatabase("/Users/jordondehoog/dev/nxbm/tmp/data");

  const release = db.find(game);
  if (release) {
    console.log(`Found release`);
  } else {
    console.log(`Unable to find release... ${game.filename()}`);
  }
}

testParseAndGrab(FILE);

export async function parseXCI(path: string): Promise<File> {
  const { headerKey, validate } = await readRawKeyFile(KEYS_PATH);
  const valid = validate();
  if (!valid.valid) {
    throw valid.errors.join("\n");
  }

  const fd = await open(path, "r");
  const stats = await stat(FILE);

  const xciData = new File({
    filepath: FILE,
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
  const details = getNCADetails(secureDetails);
  const ncaHeader = await decryptNCAHeader(FILE, headerKey, details.offset);
  xciData.assign({
    titleIDRaw: ncaHeader.titleID,
    sdkVersion: ncaHeader.formatSDKVersion(),
    masterKeyRevisionRaw: ncaHeader.masterKeyRev
  });

  // Get detailed information containe in secure partition
  await gatherNCATargets(fd, secureDetails);

  // Get the version number
  const updateHFS0 = hsf0Entries.find(entry => entry.name === "update");
  if (!updateHFS0) throw new Error("A update partition was not found");

  const updateHeader = await getFS0Header(fd, updateHFS0, hfs0Size);
  const updateEntries = await getFSEntries(fd, updateHeader, hfs0Size);
  xciData.version = findVersion(updateEntries.map(x => x.name));

  console.log(xciData.toString());
  return xciData;
}

function calcFSOffset(offset: number, additional?: number): number {
  return offset + 16 + 64 * (additional !== undefined ? additional : 1);
}

function getMainHFS0Entries(file: number, xci: XCIHeader, hfs0: FSHeader) {
  return getFSEntries(file, hfs0, xci.hfs0Offset);
}

async function getFS0Header(
  file: number,
  entry: FSEntry,
  hfs0Size: number
): Promise<FSHeader> {
  const offset = entry.offset + hfs0Size;
  return new FSHeader(await readNBytes(file, 16, offset));
}

function getFSEntries(
  file: number,
  fsHeader: FSHeader,
  startOffset: number
): BlueBird<FSEntry[]> {
  return mapPromise(Array(fsHeader.filecount), async (_, index) => {
    // Get entry
    const entryPosition = calcFSOffset(startOffset, index);
    const entry = new FSEntry(await readNBytes(file, 64, entryPosition));

    // Get name
    const namePosition =
      calcFSOffset(startOffset, fsHeader.filecount) + entry.namePtr;
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
  const secureHeader = await getFS0Header(file, rootEntry, hfs0Size);
  const secureEntries = await getFSEntries(
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

// TODO
// async function getDetailedInformation(fd: number, secureDetails: Details) {
//   //  Iterate through each `secureDetails` to gather a list of NCA targets
// }

async function gatherNCATargets(fd: number, secureDetails: Details) {
  const details = secureDetails.filter(detail => detail.size < 0x4e20000);

  // TODO
  // Temporary
  await readWriteByNBytes(
    fd,
    8192,
    details[0].size,
    TEMP_META_OUT,
    details[0].offset
  );

  // mapPromise(details, async (item, index) => {

  // })
}
