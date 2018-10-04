import { createLogger, getConfig } from "@nxbm/core";
import { format, outputFormattedJSON, underscoreToCamel } from "@nxbm/utils";
import axios from "axios";
import { outputFile, pathExists, readFile } from "fs-extra";
import { resolve } from "path";

const KEY_URL = "https://pastebin.com/raw/ekSH9R8t";

export interface Keys {
  headerKey: string;
  aesKekGenerationSource?: string;
  aesKeyGenerationSource?: string;
  keyAreaKeyApplicationSource?: string;
  masterKey: MasterKeys;
  validate: () => { valid: boolean; errors: string[] };
}

export interface MasterKeys {
  [key: string]: string;
}

export const KEYS_FILENAME = "keys.json";

const MASTER_KEY_NAME = "masterKey_";

function parseKeys(contentString: string): Keys {
  const parsed = contentString
    .trim()
    .split("\n")
    .map(input =>
      input
        .replace(/\s+/g, "")
        .split("=")
        .map(x => underscoreToCamel(x))
    )
    .filter(x => x[0].replace(/ /g, ""))
    .reduce(
      (keys, keyValue) =>
        keyValue[0].includes(MASTER_KEY_NAME)
          ? {
              ...keys,
              masterKey: {
                ...((keys as any).masterKey || {}),
                [keyValue[0].replace(MASTER_KEY_NAME, "")]: keyValue[1]
              }
            }
          : { ...keys, [keyValue[0]]: keyValue[1] },
      {}
    ) as Keys;

  parsed.validate = () => validateKeyFile(parsed);

  return parsed;
}

async function downloadKeys(destination: string) {
  const log = createLogger("Keys");
  log.info("Downloading keys file");
  log.verbose(`Saving to -> ${destination}`);

  try {
    const { data } = await axios.get(KEY_URL);
    log.verbose(`Successfully downloaded from ${KEY_URL}`);

    log.debug(`Writing to disk\n${data}`);
    await outputFile(destination, data);

    return pathExists(destination);
  } catch (error) {
    log.error("Failed to download keys");
    log.error(error);
  }

  return false;
}

async function keysExist(path: string, download: boolean) {
  if (!(await pathExists(path))) {
    if (download) {
      return downloadKeys(path);
    }
    return false;
  }
  return true;
}

let keyCache: Keys;

export async function getKeys(
  keysPath: string = getConfig().paths!.keys,
  shouldDownload: boolean = false
): Promise<Keys | undefined> {
  if (keyCache) {
    return keyCache;
  }

  const log = createLogger("Keys");

  if (!(await keysExist(keysPath, shouldDownload))) {
    return;
  }

  try {
    log.verbose(`Trying to fetch keys from ${keysPath}`);
    const keys = await readRawKeyFile(keysPath);
    const validated = keys.validate();
    log.debug(`Validation results: ${format(validated)}`);
    if (!validated.valid) {
      log.error("Failed to validate keys");
      throw validated.errors.join(",");
    }

    log.debug(`Using the following keys:\n${format(keys)}`);
    keyCache = keys;
    return keys;
  } catch (error) {
    log.error("Unable to find usable key file");
    throw error;
  }
}

export function validateKeyFile(
  keys: Keys,
  throws: boolean = false
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!keys.headerKey) {
    errors.push("Header key is required to get the Title ID!");
  }

  if (!keys.masterKey || Object.keys(keys.masterKey).length === 0) {
    errors.push("Master keys are required for more detailed information");
  }

  if (errors.length && throws) {
    throw errors.join("\n");
  }

  return { errors, valid: errors.length === 0 };
}

export async function readRawKeyFile(path: string) {
  const keyString = await readFile(resolve(path));
  return parseKeys(keyString.toString());
}

export async function saveKeys(path: string, keys: Keys) {
  return outputFormattedJSON(resolve(path, KEYS_FILENAME), keys);
}
