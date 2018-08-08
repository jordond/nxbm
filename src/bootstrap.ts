import { mkdirp } from "fs-extra";
import { resolve } from "path";

import { configPath, getConfig, validateConfig } from "./config/config";
import { create } from "./logger";
import { format } from "./util/misc";

export default async function bootstrap() {
  const config = getConfig();

  try {
    // Ensure data directory exists
    await mkdirp(resolve(config.paths.data));
  } catch (error) {
    create().error(`Unable to create data directory ${config.paths.data}`);
    throw error;
  }

  const log = create("Bootstrap");
  log.verbose(`Using ${config.paths.data} as the data directory`);
  log.debug("Validating config...");

  try {
    validateConfig();
    log.verbose("Config is valid");
  } catch (error) {
    log.error(`Config is invalid -> ${error.message}`);
    throw new Error("Config is invalid!");
  }

  log.info(`Using config from ${configPath()}`);
  log.verbose(`Using config:\n${format(config)}`);

  return config;
}
