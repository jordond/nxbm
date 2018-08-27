import { join } from "path";

import { readWriteByNBytes } from "../../util/buffer";
import { unpackRomFs, unpackSection0 } from "../hactool";
import { Detail, DetailName } from "./secure";

const APPEND_TO_FILE = "-data";

export enum UnpackTypes {
  SECTION0 = "section0",
  ROMFS = "romfs"
}

export function genRomFSDir(metaDir: string, name: DetailName) {
  const file = generateUnpackFile(UnpackTypes.ROMFS, metaDir, name);
  return `${file}${APPEND_TO_FILE}`;
}

export function genSection0Dir(metaDir: string, name: DetailName) {
  const file = generateUnpackFile(UnpackTypes.SECTION0, metaDir, name);
  return `${file}${APPEND_TO_FILE}`;
}

export async function unpackCNMTSection0(
  fd: number,
  detail: Detail,
  section0Dir: string
) {
  return unpackFile(UnpackTypes.SECTION0, fd, detail, section0Dir);
}

export async function unpackCNMTRomFS(
  fd: number,
  detail: Detail,
  romFSDir: string
) {
  return unpackFile(UnpackTypes.ROMFS, fd, detail, romFSDir);
}

function generateUnpackFile(
  type: UnpackTypes,
  metaDir: string,
  { name }: DetailName
) {
  const outRoot = join(metaDir, name);
  return join(outRoot, type);
}

async function unpackFile(
  type: UnpackTypes,
  fd: number,
  { size, offset }: Detail,
  outDir: string
) {
  const outFile = outDir.replace(APPEND_TO_FILE, "");
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
