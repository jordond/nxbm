import { mkdirp } from "fs-extra";
import { join, resolve } from "path";

import {
  configPath,
  getConfig,
  getDataDir,
  IConfig,
  saveConfig,
  validateConfig
} from "./config";
import { ensureHactool, getKeys, startScanner } from "./files";
import { getBlacklist } from "./files/games/blacklist";
import { getGameDB } from "./files/games/db";
import { getMissingDetailedInfo } from "./files/info";
import { getNSWDB } from "./files/nswdb";
import { downloadMissingMedia, getTGDB } from "./files/thegamesdb";
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
  await initFileScanner(config);

  initExtraInformation(config);

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

async function initFileScanner({ backups }: IConfig) {
  const { nswdb } = backups;

  await getNSWDB(getDataDir(), nswdb);
  await getBlacklist();

  const db = await getGameDB();
  await db.check(backups.removeBlacklisted);

  await startScanner(backups);
}

function genLogger(tag: string) {
  return create(`Bootstrap:${tag}`);
}

async function initExtraInformation({ backups }: IConfig) {
  const log = genLogger("extra");
  await getTGDB();

  if (backups.getDetailedInfo) {
    log.info("Gettings extra information about games");
    await getMissingDetails();
  }

  if (backups.downloadGameMedia) {
    log.info("Downloading missing media for games");
    getMissingMedia();
  }
}

async function getMissingDetails() {
  try {
    const gamesdb = await getGameDB();
    await getMissingDetailedInfo(gamesdb.xcis);
  } catch (error) {
    create("boostrap:info").error("Failed to get missing details", error);
  }
}

async function getMissingMedia() {
  try {
    const gamesdb = await getGameDB();
    downloadMissingMedia(gamesdb.xcis);
  } catch (error) {
    create("boostrap:media").error("Failed to get missing media", error);
  }
}
