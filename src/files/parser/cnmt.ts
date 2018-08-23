import { emptyDir, open, remove } from "fs-extra";
import { join } from "path";

import {
  openReadFile,
  readNBytes,
  readWriteByNBytes,
  takeBytes
} from "../../util/buffer";
import { findFirstFileByName, tempDir } from "../../util/filesystem";
import { create0toNArray } from "../../util/misc";
import { unpackRomFs, unpackSection0 } from "../hactool";
import { getLanguageData, NUMBER_OF_LANGUAGES } from "./languages";
import { CNMTEntry } from "./models/CNMTEntry";
import { CNMTHeader } from "./models/CNMTHeader";
import { IFile } from "./models/File";
import { NACPData } from "./models/NACPData";
import { NACPString } from "./models/NACPString";
import { Details } from "./secure";

const TEMP_OUTPUT_DIR = join(tempDir(), "parser-meta");

const getTempMetaDir = (titleId: string) => join(TEMP_OUTPUT_DIR, titleId);

export async function gatherExtraInfo(
  fd: number,
  secureDetails: Details,
  titleId: string,
  cleanup: boolean = true
) {
  const metaDir = getTempMetaDir(titleId);
  await emptyDir(metaDir);

  const result = await gatherExtraInfoImpl(fd, secureDetails, titleId, metaDir);

  if (cleanup) {
    await remove(metaDir);
  }

  return result;
}

async function gatherExtraInfoImpl(
  fd: number,
  secureDetails: Details,
  titleId: string,
  metaDir: string
): Promise<Partial<IFile>> {
  const details = secureDetails.find(item => item.name.includes(".cnmt.nca"));

  if (!details) {
    console.log("Could not find cmnt.nca");
    return {};
  }

  const { size, offset } = details;
  const outFile = join(metaDir, "section0");
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
      return processCNMTEntry(fd, secureDetails, ncaTarget, titleId, metaDir);
    }
  } else {
    console.error("not found");
  }

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
  titleId: string,
  metaDir: string
): Promise<Partial<IFile>> {
  const details = secureDetails.find(x => ncaEntry.ncaID().includes(x.name));
  if (!details) {
    console.log("match not found");
    return {};
  }

  const { size, offset } = details;
  const outFile = join(metaDir, "romfs");
  const outDir = `${outFile}-data`;

  await emptyDir(TEMP_OUTPUT_DIR);
  await readWriteByNBytes(fd, 8192, size, outFile, offset);

  try {
    await unpackRomFs(outFile, outDir);
  } catch (error) {
    console.error(error);
  }

  const nacpPath = await findFirstFileByName(outDir, "control.nacp");
  if (!nacpPath) {
    return {};
  }

  const buffer = await openReadFile(nacpPath);
  const result = await gatherDetailedInfo(buffer, outDir, titleId);

  return result;
}

async function gatherDetailedInfo(
  rawNacp: Buffer,
  unpackDir: string,
  titleId: string
): Promise<Partial<IFile>> {
  const { version: gameRevision, productId: productCode } = new NACPData(
    takeBytes(rawNacp, 0x3000).take(0x1000)
  );

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

  const languages = await getLanguageData(nacpStrings, unpackDir, titleId);
  const nacpName = nacpStrings.find(x => x.name !== "");
  const nacpDev = nacpStrings.find(x => x.developer !== "");

  // Merge it all together
  return {
    gameRevision,
    productCode,
    ...languages,
    gameName: nacpName ? nacpName.name : "?",
    developer: nacpDev ? nacpDev.developer : "?"
  };
}
