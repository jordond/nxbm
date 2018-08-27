import { mkdirp } from "fs-extra";
import { join, resolve } from "path";

import {
  configPath,
  getConfig,
  IConfig,
  saveConfig,
  validateConfig
} from "./config";
import { ensureHactool, getKeys, getReleasesDB, startScanner } from "./files";
import { getGameDB } from "./files/games/db";
import { create } from "./logger";
import { format } from "./util/misc";

export default async function bootstrap() {
  const config = getConfig();

  // Core
  await initData(config);
  await initConfig(config);

  initSecondary(config);

  return config;
}

async function initSecondary(config: IConfig) {
  await initKeys(config);
  await initHactool(config);
  await initFolderScanner(config);

  await saveConfig();
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
  const log = genLogger("Config");
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

async function initKeys({ paths, backups: { downloadKeys } }: IConfig) {
  const log = genLogger("Keys");
  try {
    log.info("Looking for a valid keys file!");
    const keys = await getKeys(paths!.keys, downloadKeys);
    if (keys) {
      log.info("Successfully found a valid key file");
    } else {
      log.warn(`Key file was not found -> ${paths!.keys}`);
      log.warn("NXBM cannot function correctly without the keys file");
      log.warn("Either add `keys` path to the config (--keys)");
      log.warn(
        "Or enable auto-download of keys in config (--downloadKeys true)"
      );
      throw new Error("Key file not found");
    }
  } catch (error) {
    log.error("Program cannot proceed without a proper keys file");
    throw error;
  }
}

async function initHactool({
  paths,
  backups: { autoInstallHactool }
}: IConfig) {
  const log = genLogger("hactool");
  try {
    const hasHactool = await ensureHactool(paths!.data!, autoInstallHactool);
    if (hasHactool) {
      log.info("Hactool is ready to go!");
    } else {
      if (!autoInstallHactool) {
        log.warn("Downloading of hactool is disabled");
        log.warn(
          `Either download it yourself and place it in ${join(
            paths!.data,
            "hactool"
          )}`
        );
        log.warn(
          "Or enable `autoInstallHactool` (--autoHactool) in the config"
        );
      } else {
        log.error("Was unable to find or download hactool!");
      }
      log.warn("Scanning files for information will not work!");
    }
  } catch (error) {
    log.error("Something bad happened when trying to get hactool");
    log.error(error);
    throw error;
  }
}

async function initFolderScanner({ backups }: IConfig) {
  await getReleasesDB(backups.nswdb);
  await getGameDB();
  await startScanner(backups);
}

function genLogger(tag: string) {
  return create(`Bootstrap:${tag}`);
}
