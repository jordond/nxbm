import { IFile } from "@nxbm/types";
import {
  create0toNArray,
  findFirstFileByName,
  readNBytes,
  tempDir
} from "@nxbm/utils";
import { map as mapPromise } from "bluebird";
import { emptyDir, open, remove } from "fs-extra";
import { join } from "path";

import {
  getUniqueLanguages,
  LanguageIconData
} from "./languages";
import { CNMTEntry } from "./models/CNMTEntry";
import { CNMTHeader } from "./models/CNMTHeader";
import { processNCA, processNCAInfo } from "./nca";
import { Details } from "./secure";
import {
  genRomFSDir,
  genSection0Dir,
  unpackCNMTRomFS,
  unpackCNMTSection0
} from "./unpack";
import { compareGameRevision } from "./version";

const TEMP_OUTPUT_DIR = join(tempDir(), "parser-meta");

export const getTempMetaDir = (titleId: string) =>
  join(TEMP_OUTPUT_DIR, titleId);

export async function gatherExtraInfo(
  fd: number,
  secure: Details,
  titleId: string,
  outputDir: string,
  cleanup: boolean = true
) {
  const metaDir = getTempMetaDir(titleId);
  await emptyDir(metaDir);

  const result = await gatherExtraInfoImpl(
    fd,
    secure,
    titleId,
    metaDir,
    outputDir
  );

  if (cleanup) {
    await remove(metaDir);
  }

  return result;
}

async function gatherExtraInfoImpl(
  fd: number,
  secureDetails: Details,
  titleId: string,
  metaDir: string,
  outputDir: string
): Promise<Partial<IFile>> {
  const details = secureDetails.filter(item => item.name.includes(".cnmt.nca"));

  if (!details.length) {
    console.log("Could not any cmnt.nca");
    return {};
  }

  const info: Info = await mapPromise(details, detail => {
    const section0Dir = genSection0Dir(metaDir, detail.name);
    return unpackCNMTSection0(fd, detail, section0Dir);
  })
    .filter(section0Dir => section0Dir !== "")
    .map(section0Dir =>
      extractInfoFromCNMT(fd, secureDetails, section0Dir, metaDir)
    )
    .reduce(
      (acc: any, curr: Info) => {
        const prev = acc as Info;
        const gameRevision = compareGameRevision(
          prev.file.gameRevision || "",
          curr.file.gameRevision || ""
        );

        const unique = getUniqueLanguages(prev.langIconData, curr.langIconData);

        const result: Info = {
          langIconData: unique,
          file: {
            gameRevision,
            gameName: prev.file.gameName || curr.file.gameName,
            developer: prev.file.developer || curr.file.developer,
            productCode: prev.file.productCode || curr.file.productCode
          }
        };

        return result;
      },
      { file: {}, langIconData: [] }
    );

  return processNCAInfo(info, outputDir, titleId);
}

export interface Info {
  file: Partial<IFile>;
  langIconData: LanguageIconData[];
}

async function extractInfoFromCNMT(
  fd: number,
  details: Details,
  section0Dir: string,
  metaDir: string
): Promise<Info> {
  const cnmtPath = await findFirstFileByName(section0Dir, ".cnmt");
  if (cnmtPath) {
    const cnmtFd = await open(cnmtPath, "r");
    const buffer = await readNBytes(cnmtFd, 32);

    const cnmtHeader = new CNMTHeader(buffer);
    const ncaTarget = await findNCATarget(cnmtFd, cnmtHeader);

    if (ncaTarget) {
      const ncaDetails = findMatchingNCADetail(details, ncaTarget);

      if (ncaDetails) {
        const romFSDir = genRomFSDir(metaDir, ncaDetails.name);

        if (await unpackCNMTRomFS(fd, ncaDetails, romFSDir)) {
          return processNCA(romFSDir);
        }
      }
    }
  }

  return { file: {}, langIconData: [] };
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
