import { join } from "path";

import { readWriteByNBytes } from "../../util/buffer";
import { unpackRomFs, unpackSection0 } from "../hactool";
import { Detail } from "./secure";

export enum UnpackTypes {
  SECTION0 = "section0",
  ROMFS = "romfs"
}

export async function getCNMTDirs(fd: number, detail: Detail, metaDir: string) {
  return unpackFile(UnpackTypes.SECTION0, fd, detail, metaDir);
}

export async function getRomFSDir(fd: number, detail: Detail, metaDir: string) {
  return unpackFile(UnpackTypes.ROMFS, fd, detail, metaDir);
}

async function unpackFile(
  type: UnpackTypes,
  fd: number,
  { size, offset, name }: Detail,
  metaDir: string
) {
  const outRoot = join(metaDir, name);
  const outFile = join(outRoot, type);
  const outDir = `${outFile}-data`;

  await readWriteByNBytes(fd, 8192, size, outFile, offset);

  try {
    if (type === UnpackTypes.SECTION0) {
      await unpackSection0(outFile, outDir);
    } else {
      await unpackRomFs(outFile, outDir);
    }
    return outDir;
  } catch (error) {
    console.error(error);
  }

  return "";
}
