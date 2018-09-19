import { map as mapPromise } from "bluebird";
import { emptyDir, open, remove } from "fs-extra";
import { join, sep } from "path";

import { readNBytes } from "../../util/buffer";
import { findFirstFileByName, tempDir } from "../../util/filesystem";
import { create0toNArray } from "../../util/misc";
import {
  createMoveIconOptions,
  findLanguageFromPath,
  getRomFSLanguageAndIcons,
  getUniqueLanguages,
  LanguageIconData,
  moveLanguageFiles
} from "./languages";
import { CNMTEntry } from "./models/CNMTEntry";
import { CNMTHeader } from "./models/CNMTHeader";
import { IFile } from "./models/File";
import { getInfoFromNACP, getNACPFromRomFS } from "./nacp";
import { Details } from "./secure";
import {
  genRomFSDir,
  genSection0Dir,
  unpackCNMTRomFS,
  unpackCNMTSection0
} from "./unpack";
import { compareGameRevision } from "./version";

const TEMP_OUTPUT_DIR = join(tempDir(), "parser-meta");

const getTempMetaDir = (titleId: string) => join(TEMP_OUTPUT_DIR, titleId);

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

  const { file, langIconData }: CNMTInfo = await mapPromise(details, detail => {
    const section0Dir = genSection0Dir(metaDir, detail);
    return unpackCNMTSection0(fd, detail, section0Dir);
  })
    .filter(section0Dir => section0Dir !== "")
    .map(section0Dir =>
      extractInfoFromCNMT(fd, secureDetails, section0Dir, metaDir)
    )
    .reduce(
      (acc: any, curr: CNMTInfo) => {
        const prev = acc as CNMTInfo;
        const gameRevision = compareGameRevision(
          prev.file.gameRevision || "",
          curr.file.gameRevision || ""
        );

        const unique = getUniqueLanguages(prev.langIconData, curr.langIconData);

        const result: CNMTInfo = {
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

  const icons = langIconData.map(lang => lang.iconPath);
  const iconPaths = createMoveIconOptions(icons, outputDir, titleId);
  const movedIcons = await moveLanguageFiles(iconPaths);
  if (movedIcons.length) {
    const iconMap = movedIcons.reduce(
      (prev, curr) => ({
        ...prev,
        [findLanguageFromPath(curr)]: curr.replace(`${outputDir}${sep}`, "")
      }),
      {}
    );
    file.languages = Object.keys(iconMap);
    file.media = { icons: iconMap };
  }

  return file;
}

interface CNMTInfo {
  file: Partial<IFile>;
  langIconData: LanguageIconData[];
}

async function extractInfoFromCNMT(
  fd: number,
  details: Details,
  section0Dir: string,
  metaDir: string
): Promise<CNMTInfo> {
  const cnmtPath = await findFirstFileByName(section0Dir, ".cnmt");
  if (cnmtPath) {
    const cnmtFd = await open(cnmtPath, "r");
    const buffer = await readNBytes(cnmtFd, 32);

    const cnmtHeader = new CNMTHeader(buffer);
    const ncaTarget = await findNCATarget(cnmtFd, cnmtHeader);

    if (ncaTarget) {
      const ncaDetails = findMatchingNCADetail(details, ncaTarget);

      if (ncaDetails) {
        const romFSDir = genRomFSDir(metaDir, ncaDetails);

        if (await unpackCNMTRomFS(fd, ncaDetails, romFSDir)) {
          const result: CNMTInfo = {
            file: {},
            langIconData: await getRomFSLanguageAndIcons(romFSDir)
          };

          const nacp = await getNACPFromRomFS(romFSDir);
          if (nacp.length) {
            result.file = await getInfoFromNACP(nacp);
          }

          return result;
        }
      }
    }
  } else {
    console.error("not found");
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
