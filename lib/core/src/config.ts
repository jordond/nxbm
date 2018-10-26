import { ENV_DEV, ENV_PROD, IConfig, schema } from "@nxbm/types";
import * as convict from "convict";
import { outputJSON } from "fs-extra";
import { join, resolve } from "path";

import { createLogger } from "./logger";

const config = convict(schema);

export const CONFIG_NAME: string = "config.json";

export function isProduction() {
  return getConfig().env === ENV_PROD;
}

export function isDevelopment() {
  return getConfig().env === ENV_DEV;
}

export function configPath() {
  let path = config.get("paths.data");
  if (!path) {
    path = join(config.get("paths.root"), "data");
    config.set("paths.data", path);
  }
  return resolve(path, CONFIG_NAME);
}

let cachedConfig: IConfig;

export function getDataDir() {
  return getConfig().paths!.data;
}

export function getCacheDir() {
  return resolve(getDataDir(), "cache");
}

export function getMediaDir() {
  return resolve(getDataDir(), "media");
}

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }

  return cachedConfig;
}

export function getFolders() {
  return getConfig().backups.folders;
}

export function validateConfig(convictConfig: convict.Config<any> = config) {
  convictConfig.validate(/* { allowed: "strict" } */);
}

export function updateConfig(data: Partial<IConfig>) {
  const mergedConfig = { ...getConfig(), ...data };
  const newConfig = convict(schema);

  newConfig.load(mergedConfig);
  validateConfig(newConfig);

  return newConfig.getProperties();
}

export async function saveConfig(data?: IConfig) {
  const log = createLogger("Config");
  log.info(`Saving config`);
  log.verbose(`-> ${configPath()}`);

  try {
    if (data) {
      config.load(data);
    }

    // Resolve the relative paths to absolute
    const paths: Partial<IConfig> = {
      paths: {
        root: resolve(config.get("paths.root")),
        data: resolve(config.get("paths.data")),
        keys: resolve(config.get("paths.keys"))
      }
    };

    // Save the config file
    await outputJSON(
      configPath(),
      {
        ...config.getProperties(),
        ...paths,
        env: ENV_PROD
      },
      { spaces: 2 }
    );

    cachedConfig = config.getProperties();
    return true;
  } catch (error) {
    log.error("Unable to save config");
    log.error(`Error -> ${error.message}`);
    return false;
  }
}

function loadConfig(): IConfig {
  try {
    config.loadFile(configPath());
  } catch (error) {
    // No existing config, load defaults
  }

  if (!config.get("paths.keys")) {
    config.set("paths.keys", join(config.get("paths.data"), "keys"));
  }

  return config.getProperties() as IConfig;
}
