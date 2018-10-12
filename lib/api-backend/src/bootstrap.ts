import { mkdirp } from "fs-extra";
import { join, resolve } from "path";

import {
  configPath,
  createLogger,
  getDataDir,
  saveConfig,
  validateConfig
} from "@nxbm/core";
import {
  downloadMissingMedia,
  getBlacklist,
  getEShopDB,
  getGameDB,
  getMissingDetailedInfo,
  getNSWDB,
  getTGDB,
  initQueue,
  startScanner
} from "@nxbm/core-db";
import {
  checkPython2,
  ensureHactool,
  getKeys,
  writeScriptsIfNotExists
} from "@nxbm/core-files";
import { IBackupConfig, IConfig } from "@nxbm/types";
import { format } from "@nxbm/utils";

export async function bootstrap(config: IConfig) {
  // Core
  await initData(config);
  await initConfig(config);

  initSecondary(config).catch(err => {
    throw err;
  });

  return config;
}

async function initSecondary(config: IConfig) {
  await saveConfig();

  if (config.backups.xci) {
    await initKeys(config);
    await initPython();
  }

  await initHactool(config);
  await initFileScanner(config);

  initExtraInformation(config);
}

async function initData({ paths }: IConfig) {
  try {
    await mkdirp(resolve(paths!.data));
  } catch (error) {
    const log = createLogger();
    log.error(`Unable to create data directory ${paths!.data}`);
    log.error(
      "Make sure the data directory specified in the config is valid, and has write access."
    );
    throw error;
  }

  createLogger("Bootstrap").verbose(
    `Using ${paths!.data} as the data directory`
  );
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

async function initKeys({ paths, backups: { downloadKeysUrl } }: IConfig) {
  const log = genLogger("Keys");
  try {
    log.info("Looking for a valid keys file!");
    const keys = await getKeys(paths!.keys, downloadKeysUrl);
    if (keys) {
      log.info("Successfully found a valid key file");
    } else {
      log.error(`Key file was not found -> ${resolve(paths!.keys)}`);
      log.error("Using XCI files will be DISABLED without a valid keys file");
      log.warn("Either add `keys` path to the config (--keys)");
      log.warn(
        "Or pass `--downloadKeysUrl` with a URL to download the keys file"
      );
      log.warn("Or dump the keys from your OWN console");
      log.warn("Use something like https://github.com/shchmue/kezplez-nx");
      log.warn(
        "If you have no interest in using XCI, pass `--xci false` or edit the config.json"
      );
    }
  } catch (error) {
    log.error("Program cannot proceed without a proper keys file");
    throw error;
  }
}

async function initPython() {
  const log = genLogger("python");
  log.info("Ensuring 'python2' exists on the path");

  const exists = await checkPython2();
  if (exists) {
    log.verbose("'python2' was found on the path!");
  } else {
    log.error("Unable to find 'python2' on the PATH");
    log.error("XCI parsing will be DISABLED until you install python2");
    log.warn("Ensure you install python2 and NOT python3");
    log.warn("python2 is required to decrypt the headers in the XCI file");
    log.warn("Adding NSP files will still work");
    log.warn(
      "If you have no interest in using XCI, pass `--xci false` or edit the config.json"
    );
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
        log.error("Was unable to find, download, or compile hactool!");
      }
      log.error("Scanning files for information will not work!");
      throw new Error("Unable to use Hactool");
    }
  } catch (error) {
    log.error("Something bad happened when trying to get hactool");
    log.error(error);
    throw error;
  }
}

async function initFileScanner({ backups }: IConfig) {
  const { nswdb } = backups;

  // Ensure the python scripts have been written to the disk
  await writeScriptsIfNotExists();

  await getNSWDB(getDataDir(), nswdb);
  await getBlacklist();

  const db = await getGameDB();
  await db.check(backups.removeBlacklisted);

  await initDatabases(backups);
  await initQueue(backups);
  await startScanner(backups);
}

function genLogger(tag: string) {
  return createLogger(`Bootstrap:${tag}`);
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
    await getMissingDetailedInfo(gamesdb.toList());
  } catch (error) {
    createLogger("boostrap:info").error("Failed to get missing details", error);
  }
}

async function getMissingMedia() {
  const log = createLogger("bootstrap:media");
  try {
    const gamesdb = await getGameDB();
    if (!gamesdb.toList().length) {
      log.info("No games to scrape");
      return;
    }

    const result = await downloadMissingMedia(gamesdb.uniqueTitleIds());
    const success = result.filter(x => x);

    if (success.length) {
      log.info(`Scraped media for ${success.length} games`);
    }

    if (success.length !== result.length) {
      log.warn(
        `Unable to scrape ${result.length - success.length}/${
          result.length
        } games`
      );
    }

    log.info("Finished missing media download");
  } catch (error) {
    log.error("Failed to get missing media");
    log.error(error);
  }
}

async function initDatabases({ getDetailedInfo }: IBackupConfig) {
  const promises = [
    getNSWDB(),
    ...(getDetailedInfo ? [getTGDB(), getEShopDB()] : [])
  ];

  await Promise.all(promises as any[]);
}
