import { IFile } from "@nxbm/types";
import { readWriteByNBytes } from "@nxbm/utils";
import { join, sep } from "path";

import { getInfo, unpackRomFs } from "../hactool";
import { getTempMetaDir, Info } from "./cnmt";
import {
  createMoveIconOptions,
  findLanguageFromPath,
  getRomFSLanguageAndIcons,
  moveLanguageFiles
} from "./languages";
import { PFS0Entry } from "./models/PFS0Entry";
import { PFS0Header } from "./models/PFS0Header";
import { getInfoFromNACP, getNACPFromRomFS } from "./nacp";
import { APPEND_TO_FILE, UnpackTypes } from "./unpack";

export async function writeNCATargetRomFS(
  header: PFS0Header,
  target: PFS0Entry,
  titleid: string
) {
  const outPath = join(getTempMetaDir(titleid), target.name);
  await readWriteByNBytes(
    header.fd,
    target.size,
    64 * 1024,
    join(outPath, UnpackTypes.ROMFS),
    header.getEntryOffset(target)
  );

  return outPath;
}

export async function unpackAndProcessTargetNCA(romfsDir: string) {
  const unpackDir = await unpackTargetNCA(romfsDir);
  return processNCA(unpackDir);
}

export async function unpackTargetNCA(romfsDir: string) {
  const outPath = join(romfsDir, `${UnpackTypes.ROMFS}${APPEND_TO_FILE}`);
  await unpackRomFs(join(romfsDir, UnpackTypes.ROMFS), outPath);

  return outPath;
}

export async function processNCA(unpackDir: string) {
  const result: Info = {
    file: {},
    langIconData: await getRomFSLanguageAndIcons(unpackDir)
  };

  const nacp = await getNACPFromRomFS(unpackDir);
  if (nacp.length) {
    result.file = await getInfoFromNACP(nacp);
  }

  return result;
}

export async function processNCAInfo(
  { file, langIconData }: Info,
  outputDir: string,
  titleid: string
) {
  const icons = langIconData.map(lang => lang.iconPath);
  const iconPaths = createMoveIconOptions(icons, outputDir, titleid);
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

enum RomFSInfo {
  SDK_VERSION = "SDK Version",
  DIST_TYPE = "Distribution type",
  MASTER_KEY_REV = "Master Key Revision"
}

export async function parseRomFSInfo(
  romfsDir: string
): Promise<Partial<IFile>> {
  const romfsFile = join(romfsDir, UnpackTypes.ROMFS);
  const targetProps = Object.values(RomFSInfo);

  const stdout = await getInfo(romfsFile);
  const result = stdout
    .split(/\n/g)
    .map(line => line.trim())
    .filter(line => targetProps.some(prop => line.includes(prop)))
    .map(line => {
      const keyPair = line.split(":");
      return { [keyPair[0]]: keyPair[1].trim() };
    })
    .reduce((acc, keypair) => ({ ...acc, ...keypair }), {});

  return {
    sdkVersion: result[RomFSInfo.SDK_VERSION],
    distributionType: result[RomFSInfo.DIST_TYPE],
    masterKeyRevision: result[RomFSInfo.MASTER_KEY_REV]
  };
}
