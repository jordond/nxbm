import { basename } from "path";

import { getDataDir } from "../../config";
import { create } from "../../logger";
import { getKeys } from "../keys";
import { isXCI, parseXCI } from "../parser";
import { File } from "../parser/models/File";
import { isBlacklisted } from "./blacklist";
import { getGameDB } from "./db";

const TAG = "games";

export async function addFile(filePath: string) {
  const log = create(`${TAG}:add`);

  const db = await getGameDB();
  let found = db.findByFileName(filePath);

  if (!found) {
    const parsed = await parseFile(filePath);
    if (!parsed) {
      return;
    }

    found = db.find(parsed);
    if (!found) {
      const ignored = await isBlacklisted(parsed);
      if (ignored) {
        log.info(`${parsed.displayName()} is on the blacklist, skipping`);
        return;
      }

      const game = await db.add(parsed);
      log.info(`Added ${parsed.displayName()}`);
      db.save();
      return game;
    }
  }

  log.info(`Skipping ${found.file.displayName()}, already found in database`);
  return found;
}

export async function removeFile(filePath: string) {
  const log = create(`${TAG}:remove`);

  const db = await getGameDB();
  const found = await db.findByFileName(filePath);
  if (found) {
    log.info(`Removed ${found.file.displayName()}`);
    db.remove(found);
    db.save();
  } else {
    log.warn(`Failed to remove ${filePath}, could not find a matching game`);
  }
}

async function parseFile(filePath: string): Promise<File | undefined> {
  const log = create(`${TAG}:${basename(filePath)}`);

  log.debug("Checking if file is an xci...");
  if (await isXCI(filePath)) {
    log.silly(`Is an XCI file!`);
    try {
      return parseXCIFile(filePath);
    } catch (error) {
      log.error("Failed to parse XCI file!");
      log.error(`-> ${filePath}`);
      log.error(error);
    }

    return;
  }

  log.warn(`Is an unsupported file type!`);
  log.warn("Currently only XCI files are supported!");
}

async function parseXCIFile(filePath: string): Promise<File | undefined> {
  const log = create(`${TAG}:parse`);
  const keys = await getKeys();
  if (!keys) {
    log.error("Unable to find decryption keys, unable to parse XCI");
    return;
  }

  log.verbose(`Parsing ${filePath}`);
  try {
    const file = await parseXCI(filePath, keys.headerKey, getDataDir());
    log.verbose(`Successfully parsed ${file.displayName()}`);

    return file;
  } catch (error) {
    log.error(`Unable to parse ${filePath}`);
    log.error(error);
  }
}
