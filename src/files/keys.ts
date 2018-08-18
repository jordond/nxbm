import { outputJSON, readFile } from "fs-extra";
import { resolve } from "path";

import { underscoreToCamel } from "../util/string";

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
  return outputJSON(resolve(path, KEYS_FILENAME), keys);
}
