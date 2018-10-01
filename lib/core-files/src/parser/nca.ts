import { readWriteByNBytes } from "@nxbm/utils";
import { join, sep } from "path";

import { unpackRomFs } from "../hactool";
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
