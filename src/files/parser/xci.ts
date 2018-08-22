import BlueBird, { map as mapPromise } from "bluebird";
import { emptyDir, move, open, pathExists, remove, stat } from "fs-extra";

import { join, resolve } from "path";
import { getCacheDir } from "../../config";
import {
  openReadFile,
  readByByte,
  readNBytes,
  readWriteByNBytes,
  takeBytes
} from "../../util/buffer";
import { findFirstFileByName } from "../../util/filesystem";
import { create0toNArray } from "../../util/misc";
import { unpackRomFs, unpackSection0 } from "../hactool";
import { readRawKeyFile } from "../keys";
import { getGameDatabase } from "../nswdb";
import { CNMTEntry } from "./models/CNMTEntry";
import { CNMTHeader } from "./models/CNMTHeader";
import { File, IFile } from "./models/File";
import { FSEntry } from "./models/FSEntry";
import { FSHeader } from "./models/FSHeader";
import { getLangAt, LANGUAGES, NUMBER_OF_LANGUAGES } from "./models/languages";
import { NACPData } from "./models/NACPData";
import { NACPString } from "./models/NACPString";
import { XCIHeader } from "./models/XCIHeader";
import { decryptNCAHeader, Detail, Details, getNCADetails } from "./secure";
import { findVersion } from "./version";

const FILE =
  "/Users/jordondehoog/Downloads/switchsd/0003 - ARMS (World) (En,Ja,Fr,De,Es,It,Nl,Ru) [Trimmed].xci";

const KEYS_PATH = "/Users/jordondehoog/dev/nxbm/tmp/data/keys";
const TEMP_META_OUT = "/Users/jordondehoog/dev/nxbm/tmp/data/meta";

async function testParseAndGrab(path: string) {
  const game = await parseXCI(path);
  const db = await getGameDatabase("/Users/jordondehoog/dev/nxbm/tmp/data");

  const release = db.find(game);
  if (release) {
    console.log(`Found release`);
    game.fromRelease(release);
  } else {
    console.log(`Unable to find release... ${game.filename}`);
  }

  console.log(JSON.stringify(game, null, 2));
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
    ncaHeader.titleId()
  );
  xciData.assign(extraInfo);

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

async function gatherExtraInfo(
  fd: number,
  secureDetails: Details,
  titleId: string
): Promise<Partial<IFile>> {
  const details = secureDetails.find(item => item.name.includes(".cnmt.nca"));

  if (!details) {
    console.log("Could not find cmnt.nca");
    return {};
  }

  const { size, offset } = details;
  const outFile = join(TEMP_META_OUT, "secion0");
  const outDir = `${outFile}-data`;

  await readWriteByNBytes(fd, 8192, size, outFile, offset);

  try {
    await unpackSection0(outFile, outDir);
  } catch (error) {
    console.error(error);
  }

  const cnmtPath = await findFirstFileByName(outDir, ".cnmt");
  if (cnmtPath) {
    const cnmtFd = await open(cnmtPath, "r");
    const buffer = await readNBytes(cnmtFd, 32);

    const cnmtHeader = new CNMTHeader(buffer);
    const ncaTarget = await findNCATarget(cnmtFd, cnmtHeader);
    if (ncaTarget) {
      return processCNMTEntry(fd, secureDetails, ncaTarget, titleId);
    }
  } else {
    console.error("not found");
  }

  remove(TEMP_META_OUT);
  return {};
}

async function findNCATarget(cnmtFd: number, header: CNMTHeader) {
  const readLength = 56;
  const initialPosition = header.offset + 32;
  for (const count of create0toNArray(header.contentCount)) {
    const position = initialPosition + (count === 0 ? 0 : count * readLength);
    const entry = new CNMTEntry(await readNBytes(cnmtFd, readLength, position));
    if (entry.isTypeContent()) {
      return entry;
    }
  }

  return null;
}

async function processCNMTEntry(
  fd: number,
  secureDetails: Details,
  ncaEntry: CNMTEntry,
  titleId: string
): Promise<Partial<IFile>> {
  const details = secureDetails.find(x => ncaEntry.ncaID().includes(x.name));
  if (!details) {
    console.log("match not found");
    return {};
  }

  const { size, offset } = details;
  const outFile = join(TEMP_META_OUT, "romfs");
  const outDir = `${outFile}-data`;

  await emptyDir(TEMP_META_OUT);

  await readWriteByNBytes(fd, 8192, size, outFile, offset);

  try {
    await unpackRomFs(outFile, outDir);
  } catch (error) {
    console.error(error);
  }

  const nacpPath = await findFirstFileByName(outDir, "control.nacp");
  if (!nacpPath) {
    remove(TEMP_META_OUT);
    return {};
  }

  const buffer = await openReadFile(nacpPath);
  const result = await getLanguageInfo(buffer, outDir, titleId);

  await remove(TEMP_META_OUT);
  return result;
}

async function getLanguageInfo(
  rawNacp: Buffer,
  unpackDir: string,
  titleId: string
): Promise<Partial<IFile>> {
  // Get version
  const { version: gameRevision, productId: productCode } = new NACPData(
    takeBytes(rawNacp, 0x3000).take(0x1000)
  );

  // Get Nacp Strings
  const nacpStrings = create0toNArray(NUMBER_OF_LANGUAGES)
    .map(
      index =>
        new NACPString(
          takeBytes(rawNacp)
            .skip(index * 0x300)
            .take(0x300)
        )
    )
    .filter(nacp => nacp.check);

  // Get the game name and developer
  const nacpName = nacpStrings.find(x => x.name !== "");
  const nacpDev = nacpStrings.find(x => x.developer !== "");

  // Get the language and region data
  const promises = nacpStrings.map((_, index) =>
    createLanguageFilename(index, unpackDir, titleId)
  );

  const filenames = await Promise.all(promises);
  const languages = await moveLanguageFiles(filenames);

  // Merge it all together
  return {
    gameRevision,
    productCode,
    ...languages,
    gameName: nacpName ? nacpName.name : "?",
    developer: nacpDev ? nacpDev.developer : "?"
  };
}

interface LanguageIconData {
  input: string;
  out: string;
  language: string;
}

async function createLanguageFilename(
  index: number,
  unpackDir: string,
  titleId: string
): Promise<LanguageIconData> {
  const genInput = (x: string) =>
    resolve(unpackDir, `icon_${x.replace(/ /g, "")}.dat`);

  const shouldReplaceTai =
    index === 13 && (await pathExists(genInput(LANGUAGES.TAIWANESE)));
  const lang = (shouldReplaceTai
    ? LANGUAGES.TRADITIONAL_CHINESE
    : getLangAt(index)
  ).replace(/ /g, "");

  return {
    input: genInput(lang),
    out: join(getCacheDir(), "icons", titleId, `icon_${titleId}_${lang}.bmp`),
    language: getLangAt(index)
  };
}

async function moveLanguageFiles(paths: LanguageIconData[]) {
  const results: Partial<IFile> = {
    regionIcon: {},
    languages: []
  };
  for (const { input, out, language } of paths) {
    try {
      if (await pathExists(input)) {
        await move(input, out, { overwrite: true });
        results.regionIcon![language] = out;
        results.languages!.push(language);
      }
    } catch (error) {
      console.error(`couldnt move`);
      console.error(error);
    }
  }

  return results;
}
