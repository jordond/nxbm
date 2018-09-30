import { createLogger } from "@nxbm/core";
import { map } from "bluebird";
import { outputFile, pathExists } from "fs-extra";
import { resolve } from "path";

import aes128 from "./aes128";
import xtsdecrypt from "./xtsdecrypt";

const scripts = [aes128, xtsdecrypt];

export async function ensurePythonScripts() {
  const results = await map(scripts, async script => {
    const log = createLogger("python");
    try {
      const filename = resolve(__dirname, `${script.name}.py`);
      if (await pathExists(filename)) {
        return true;
      }

      log.debug(`Attempting to write ${filename}`);
      await outputFile(filename, script.script);
      log.verbose(`Successfully wrote ${filename}`);
      return true;
    } catch (error) {
      log.error(`Failed to output python file`);
      log.error(error);
      return false;
    }
  }).filter(x => x);

  return results.length;
}
