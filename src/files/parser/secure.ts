import { open, outputFile, remove } from "fs-extra";
import { tmpdir } from "os";
import { basename, join, resolve } from "path";

import { openReadNBytes, readNBytes } from "../../util/buffer";
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

    const tempPath = resolve(
      tmpdir(),
      "nxbm",
      "decrypt-nca",
      basename(filePath)
    );
    const inputPath = join(tempPath, `encrypted`);
    await outputFile(inputPath, encrypted);

    const output = join(tempPath, `decrpted`);
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

export interface CNMTDetail extends Detail {
  path: string;
}
