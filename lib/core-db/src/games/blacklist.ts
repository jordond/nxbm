import { createLogger, getDataDir } from "@nxbm/core";
import { IFile } from "@nxbm/types";
import { outputFormattedJSON } from "@nxbm/utils";
import { pathExists, readJSON } from "fs-extra";
import { basename, resolve } from "path";

const DB_FILENAME = "blacklist.json";
const log = createLogger("games:blacklist");

export interface Blacklist {
  filepath: string;
  titleid: string;
  revision: string;
  added: Date;
}

let blacklist: Blacklist[];

export async function getBlacklist() {
  if (!blacklist) {
    blacklist = await loadBlacklist();
  }

  log.info(`Loaded the blacklist with ${blacklist.length} entries`);

  return blacklist;
}

export function addToBlacklist(file: IFile) {
  log.verbose(`Adding ${file.displayName()} to the blacklist`);

  if (isBlacklisted(file)) {
    log.verbose(`File is already blacklisted`);
    return false;
  }

  blacklist.push({
    filepath: file.filepath,
    titleid: file.titleID,
    revision: file.gameRevision,
    added: new Date()
  });

  saveBlacklist();

  return true;
}

export function isBlacklisted(file: IFile) {
  log.debug(`Checking if ${file.displayName()} is blacklisted`);

  const list = blacklist;
  let blacklisted: boolean = !!list.find(
    ({ filepath }) => filepath === file.filepath
  );

  if (!blacklisted) {
    const found = list.find(item => basename(item.filepath) === file.filename);
    blacklisted =
      !!found &&
      (found.titleid === file.titleID && found.revision === file.gameRevision);
  }

  return blacklisted;
}

export async function loadBlacklist(): Promise<Blacklist[]> {
  const path = getBlacklistPath();
  log.debug(`Loading blacklist from ${path}`);

  if (!(await pathExists(path))) {
    log.verbose("Blacklist is empty");
    return [];
  }

  try {
    const result: Blacklist[] = await readJSON(path);
    log.verbose(`Found ${result.length} items in the blacklist`);
    return result;
  } catch (error) {
    log.error("Unable to read the blacklist!");
    log.error(error);
  }

  return [];
}

export async function saveBlacklist(data: Blacklist[] = blacklist) {
  const path = getBlacklistPath();
  log.verbose(`Attempting to save the blacklist to ${path}`);
  try {
    await outputFormattedJSON(path, data);
    return true;
  } catch (error) {
    log.error("Unable to save the blacklist");
    log.error(error);
  }

  return false;
}

export function getBlacklistPath(): string {
  return resolve(getDataDir(), DB_FILENAME);
}
