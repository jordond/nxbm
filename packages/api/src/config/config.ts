import { IConfig, schema } from "@nxbm/types";
import * as convict from "convict";
import { join, resolve } from "path";

import { create } from "../logger";
import { outputFormattedJSON } from "../util/filesystem";

const config = convict(schema);

export const CONFIG_NAME: string = "config.json";

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
  const log = create("Config");
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
    await outputFormattedJSON(configPath(), {
      ...config.getProperties(),
      ...paths
    });

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
