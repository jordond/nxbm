import { open } from "fs-extra";

import BlueBird, { map as mapPromise } from "bluebird";
import { readByByte, readNBytes } from "../../util/buffer";
import { FSEntry } from "./models/FSEntry";
import { FSHeader } from "./models/FSHeader";
import { Detail, Details } from "./secure";
import { findVersion } from "./Version";
import { XCIHeader } from "./XCIHeader";

const FILE =
  "/Users/jordondehoog/Downloads/switchsd/0003 - ARMS (World) (En,Ja,Fr,De,Es,It,Nl,Ru) [Trimmed].xci";

open(FILE, "r", async (err, fd) => {
  if (err) {
    console.error("Whoops");
    console.error(err);
    return;
  }

  const xciHeader = new XCIHeader(await readNBytes(fd, 61440));
  console.log(xciHeader.toString());

  const hfs0Header = new FSHeader(
    await readNBytes(fd, 16, xciHeader.hfs0Offset)
  );
  console.log(hfs0Header.toString());

  const hfs0Size = xciHeader.hfs0Offset + xciHeader.hfs0Size;
  const hsf0Entries: FSEntry[] = await getMainHFS0Entries(
    fd,
    xciHeader,
    hfs0Header
  );
  hsf0Entries.forEach(x => console.log(x.toString()));

  // Handle secure partition details
  const secureHFS0 = hsf0Entries.find(entry => entry.name === "secure");
  if (!secureHFS0) throw new Error("A Secure partition was not found!");

  const secureDetails = await getSecureHFS0Details(fd, secureHFS0, hfs0Size);
  console.log(JSON.stringify(secureDetails, null, 2));

  // Get the version number
  const updateHFS0 = hsf0Entries.find(entry => entry.name === "update");
  if (!updateHFS0) throw new Error("A update partition was not found");

  const updateHeader = await getFS0Header(fd, updateHFS0, hfs0Size);
  const updateEntries = await getFSEntries(fd, updateHeader, hfs0Size);
  console.log(`XCI Version: ${findVersion(updateEntries.map(x => x.name))}`);
});

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
  const header = new FSHeader(await readNBytes(file, 16, offset));
  console.log(header.toString());

  return header;
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
  const secureDetail = secureEntries.map<Detail>(entry => ({
    size: entry.size,
    offset: calcSecureOffset(secureHeader, rootEntry, entry, hfs0Size)
  }));

  secureEntries.forEach(x => console.log(x.toString()));

  return secureDetail;
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
