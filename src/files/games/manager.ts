import { basename } from "path";

import { pathExists } from "fs-extra";
import { getDataDir } from "../../config";
import { create } from "../../logger";
import { getKeys } from "../keys";
import { isXCI, parseXCI } from "../parser";
import { File } from "../parser/models/File";
import { getGameDB } from "./db";

const TAG = "games";

export async function addFile(filePath: string) {
  const log = create(`${TAG}:add`);

  const db = await getGameDB();

  let file = db.findByFileName(filePath);
  if (!file || !(await pathExists(file.filepath))) {
    file = await parseFile(filePath);
    if (!file) {
      log.error(`Failed to parse ${basename(filePath)}`);
      return false;
    }
  }

  const exists = file ? file : db.find(file);
  if (exists) {
    log.info(`Skipping ${exists.displayName()}, already found in database`);
    return exists;
  }

  db.add(file);
  log.info(`Added ${file.displayName()}`);
  db.save();
}

export async function removeFile(filePath: string) {
  const log = create(`${TAG}:remove`);

  const db = await getGameDB();
  const found = db.findByFileName(filePath);
  if (found) {
    log.info(`Removed ${found.displayName()}`);
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

  // TODO
  // Check if is NSP

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
    log.error(error);
  }
}
