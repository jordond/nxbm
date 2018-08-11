import { mkdirp } from "fs-extra";
import { resolve } from "path";

import {
  configPath,
  getConfig,
  IConfig,
  saveConfig,
  validateConfig
} from "./config";
import { getReleasesDB, startScanner } from "./files";
import { create } from "./logger";
import { format } from "./util/misc";

export default async function bootstrap() {
  const config = getConfig();

  await initData(config);
  await initConfig(config);
  await initFolderScanner(config);

  await saveConfig();

  return config;
}

async function initData({ paths }: IConfig) {
  try {
    await mkdirp(resolve(paths!.data));
  } catch (error) {
    create().error(`Unable to create data directory ${paths!.data}`);
    throw error;
  }

  create("Bootstrap").verbose(`Using ${paths!.data} as the data directory`);
}

async function initConfig(config: IConfig) {
  const log = create("Bootstrap:Config");
  log.info(`Using config from ${configPath()}`);

  try {
    log.debug("Validating config...");
    validateConfig();
    log.verbose("Config is valid");
  } catch (error) {
    log.error(`Config is invalid -> ${error.message}`);
    throw new Error("Config is invalid!");
  }

  log.verbose(`Using config:\n${format(config)}`);
}

async function initFolderScanner({ backups }: IConfig) {
  await getReleasesDB(backups.nswdb);
  await startScanner(backups);
}
