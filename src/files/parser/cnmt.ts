import { map as mapPromise } from "bluebird";
import { emptyDir, open, remove } from "fs-extra";
import { join } from "path";

import { readNBytes } from "../../util/buffer";
import { findFirstFileByName, tempDir } from "../../util/filesystem";
import { create0toNArray } from "../../util/misc";
import { CNMTEntry } from "./models/CNMTEntry";
import { CNMTHeader } from "./models/CNMTHeader";
import { IFile } from "./models/File";
import { getInfoFromNACP, getNACPFromRomFS } from "./nacp";
import { Details } from "./secure";
import { getCNMTDirs, getRomFSDir } from "./unpack";
import { compareGameRevision } from "./version";

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
  const details = secureDetails.filter(item => item.name.includes(".cnmt.nca"));

  if (!details.length) {
    console.log("Could not any cmnt.nca");
    return {};
  }

  const info: Partial<IFile> = await mapPromise(details, detail =>
    getCNMTDirs(fd, detail, metaDir)
  )
    .filter(cnmtDir => cnmtDir !== "")
    .map(cnmt => extractInfoFromCNMT(fd, secureDetails, cnmt, metaDir, titleId))
    .reduce((prev: Partial<IFile>, curr) => {
      const gameRevision = compareGameRevision(
        prev.gameRevision || "",
        curr.gameRevision || ""
      );

      const languages = [
        ...new Set(prev.languages || []),
        ...new Set(curr.languages)
      ];

      return {
        gameRevision,
        languages,
        gameName: prev.gameName || curr.gameName,
        developer: prev.developer || curr.developer,
        productCode: prev.productCode || curr.productCode
      };
    }, {});

  return info;
}

async function extractInfoFromCNMT(
  fd: number,
  details: Details,
  cnmtDir: string,
  metaDir: string,
  titleId: string
) {
  const cnmtPath = await findFirstFileByName(cnmtDir, ".cnmt");
  if (cnmtPath) {
    const cnmtFd = await open(cnmtPath, "r");
    const buffer = await readNBytes(cnmtFd, 32);

    const cnmtHeader = new CNMTHeader(buffer);
    const ncaTarget = await findNCATarget(cnmtFd, cnmtHeader);
    if (ncaTarget) {
      const ncaDetails = findMatchingNCADetail(details, ncaTarget);
      if (ncaDetails) {
        const romFSDir = await getRomFSDir(fd, ncaDetails, metaDir);
        const nacp = await getNACPFromRomFS(romFSDir);
        if (nacp.length) {
          return getInfoFromNACP(nacp, romFSDir, titleId);
        }
      }
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

function findMatchingNCADetail(secureDetails: Details, targetNCA: CNMTEntry) {
  return secureDetails.find(secureFile =>
    targetNCA.ncaID().includes(secureFile.name)
  );
}
