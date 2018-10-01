import {
  openReadNBytes,
  readNBytes,
  tempDir
} from "@nxbm/utils";
import { open, outputFile, remove } from "fs-extra";
import { basename, join, resolve } from "path";

import { NCAHeader } from "./models/NCAHeader";
import { decrypt } from "./py/decrypt";

export function getNCADetails(details: Details): Detail {
  let master: number = -9223372036854775808;
  return details.reduce<Detail>(
    (prev, curr) => {
      if (curr.size > master) {
        master = curr.size;
        return curr;
      }
      return prev;
    },
    { size: -1, offset: -1, name: "" }
  );
}

export async function decryptNCAHeader(
  filePath: string,
  key: string,
  offset: number,
  cleanUp: boolean
) {
  try {
    const encrypted = await openReadNBytes(filePath, 3072, offset);

    // TODO - Change to allow custom temp folder
    const tempPath = resolve(tempDir(), "decrypt-nca", basename(filePath));
    const inputPath = join(tempPath, `encrypted`);
    await outputFile(inputPath, encrypted);

    const output = join(tempPath, `decrypted`);
    await decrypt({ key, inputPath, output });

    const decrypted = await readNBytes(await open(output, "r"), 3072);
    const ncaHeader = new NCAHeader(decrypted);

    if (cleanUp) {
      await remove(tempPath);
    }

    return ncaHeader;
  } catch (error) {
    console.error("Failed to decrypt NCA header");
    console.error(error);
    throw error;
  }
}

export type Details = Detail[];

export interface Detail {
  size: number;
  name: string;
  offset: number;
}

export interface DetailNumbers {
  size: number;
  offset: number;
}

export interface DetailName {
  name: string;
  size?: number;
  offset?: number;
}

export interface CNMTDetail extends Detail {
  path: string;
}
