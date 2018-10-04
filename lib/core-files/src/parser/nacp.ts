import { IFile } from "@nxbm/types";
import {
  create0toNArray,
  findFirstFileByName,
  openReadFile,
  takeBytes
} from "@nxbm/utils";

import { NUMBER_OF_LANGUAGES } from "./languages";
import { NACPData } from "./models/NACPData";
import { NACPString } from "./models/NACPString";

export async function getNACPFromRomFS(romFSDir: string): Promise<Buffer> {
  const nacpPath = await findFirstFileByName(romFSDir, "control.nacp");
  if (!nacpPath) {
    console.error(`Could not find ${nacpPath}`);
    return Buffer.alloc(0);
  }

  return openReadFile(nacpPath);
}

export async function getInfoFromNACP(
  rawNacp: Buffer
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

  const nacpName = nacpStrings.find(x => x.name !== "");
  const nacpDev = nacpStrings.find(x => x.developer !== "");

  // Merge it all together
  return {
    gameRevision,
    productCode,
    gameName: nacpName ? nacpName.name : "",
    developer: nacpDev ? nacpDev.developer : ""
  };
}
