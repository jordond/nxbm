import * as convict from "convict";
import { resolve } from "path";
import { IConfig, schema } from "./schema";

const config = convict(schema);

export const CONFIG_NAME: string = "config.json";

export function configPath() {
  return resolve(config.get("paths.data"), CONFIG_NAME);
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
