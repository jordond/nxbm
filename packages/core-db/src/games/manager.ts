import { createLogger, getConfig, getMediaDir } from "@nxbm/core";
import { File, getKeys, isXCI, parseXCI } from "@nxbm/core-files";
import { Game, IGameDB } from "@nxbm/types";
import { safeRemove } from "@nxbm/utils";
import { basename } from "path";

import { getEshopInfoForFile, getTGDBInfoForFile } from "../info";
import { getNSWDB } from "../nswdb";
import { downloadGameMedia } from "../thegamesdb/media";
import { addToBlacklist, isBlacklisted } from "./blacklist";
import { getGameDB } from "./db";

const TAG = "games";

export async function addFile(filePath: string) {
  const log = createLogger(`${TAG}:add`);

  const db = await getGameDB();
  let found = db.findByFileName(filePath);

  if (!found) {
    const parsed = await parseFile(filePath);
    if (!parsed) {
      return;
    }

    // Check if game doesn't exist in the game database
    found = db.find(parsed);
    if (!found) {
      const ignored = await isBlacklisted(parsed);
      if (ignored) {
        log.info(`${parsed.displayName()} is on the blacklist, skipping`);
        return;
      }

      await getNSWDBInfo(parsed);

      const { backups } = getConfig();
      if (backups.downloadGameMedia) {
        getGameMedia(parsed);
      }

      if (backups.getDetailedInfo) {
        getTGDBInfoForFile(parsed);
        getEshopInfoForFile(parsed);
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

export async function removeFile(
  db: IGameDB,
  game: Game,
  hardDelete: boolean = false
) {
  const log = createLogger(`${TAG}:remove`);

  db.remove(game);
  db.save();
  addToBlacklist(game.file);

  log.info(`Removed ${game.file.displayName()}`);
  if (!hardDelete) {
    return true;
  }

  log.info(`Deleting ${game.file.displayName()} from the disk`);
  return safeRemove(game.file.filepath);
}

export async function markFileAsMissing(filePath: string) {
  const log = createLogger(`${TAG}:missing`);

  const db = await getGameDB();
  const found = await db.findByFileName(filePath);
  if (found) {
    log.info(`${found.file.displayName()} has gone missing!`);
    return db.markMissing(found);
  }

  log.debug(`File must have been deleted by the user`);
  return false;
}

async function parseFile(filePath: string): Promise<File | undefined> {
  const log = createLogger(`${TAG}:${basename(filePath)}`);

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
  const log = createLogger(`${TAG}:parse`);
  const keys = await getKeys();
  if (!keys) {
    log.error("Unable to find decryption keys, unable to parse XCI");
    return;
  }

  log.verbose(`Parsing ${filePath}`);
  try {
    const file = await parseXCI(filePath, keys.headerKey, getMediaDir());
    log.verbose(`Successfully parsed ${file.displayName()}`);

    return file;
  } catch (error) {
    log.error(`Unable to parse ${filePath}`);
    log.error(error);
  }
}

async function getNSWDBInfo(file: File) {
  const log = createLogger(`${TAG}:nswdb`);
  const nswdb = await getNSWDB();
  const release = nswdb.find(file.titleID);
  if (release) {
    log.info(`Found a match in the scene db: ${release.releasename}`);
    file.assignRelease(release);
  } else {
    log.info(
      `Unable to find a matching game in the scene db: ${file.displayName()}`
    );
  }
}

async function getGameMedia(file: File) {
  const log = createLogger(`${TAG}:tgdb:${file.titleID}`);
  log.info(`Attempting to download media for ${file.gameName}`);

  const result = await downloadGameMedia(file, 0.01);
  if (!result) {
    log.warn(`Unable to find a match for ${file.gameName}`);
  } else {
    log.info("Successfully downloaded media");
  }
}