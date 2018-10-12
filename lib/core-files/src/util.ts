import { getConfig } from "@nxbm/core";

import { checkPython2, keysExist } from "../";

export async function canUseXCI() {
  try {
    const config = getConfig();
    const hasKeyFile = keysExist(
      config.paths!.keys,
      config.backups.downloadKeysUrl
    );
    const hasPython2 = checkPython2();

    const result = await Promise.all([hasKeyFile, hasPython2]);
    return result.every(x => x);
  } catch (error) {
    return false;
  }
}
