import * as convict from "convict";
import { outputJson } from "fs-extra";
import { join, resolve } from "path";

import { create } from "../logger";
import { IConfig, schema } from "./schema";

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

export function loadConfig(): IConfig {
  try {
    config.loadFile(configPath());
  } catch (error) {
    // No existing config, load defaults
  }

  return config.getProperties() as IConfig;
}

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }

  return cachedConfig;
}

export function validateConfig() {
  config.validate({ allowed: "strict" });
}

export async function saveConfig(data?: IConfig) {
  const log = create("Config");
  log.info(`Saving config`);
  log.debug(`-> ${configPath()}`);

  try {
    if (data) {
      config.load(data);
    }

    // Resolve the relative paths to absolute
    const paths = {
      paths: {
        root: resolve(config.get("paths.root")),
        data: resolve(config.get("paths.data"))
      }
    };

    // Save the config file
    await outputJson(
      configPath(),
      { ...config.getProperties(), ...paths },
      { spaces: 2 }
    );
  } catch (error) {
    log.error("Unable to save config");
    log.error(`Error -> ${error.message}`);
  }
}
