import { basename } from "path";

import { getConfig, getMediaDir } from "../../config";
import { create } from "../../logger";
import { safeRemove } from "../../util/filesystem";
import { getKeys } from "../keys";
import { getNSWDB } from "../nswdb";
import { isXCI, parseXCI } from "../parser";
import { File } from "../parser/models/File";
import { downloadGameMedia } from "../thegamesdb";
import { addToBlacklist, isBlacklisted } from "./blacklist";
import { getGameDB } from "./db";
import { Game, GameDB } from "./gamedb";

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

    // Check if game doesn't exist in the game database
    found = db.find(parsed);
    if (!found) {
      const ignored = await isBlacklisted(parsed);
      if (ignored) {
        log.info(`${parsed.displayName()} is on the blacklist, skipping`);
        return;
      }

      await getNSWDBInfo(parsed);

      if (getConfig().backups.downloadGameMedia) {
        await getGameMedia(parsed);
      }

      await getEshopInfo(parsed);

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
  db: GameDB,
  game: Game,
  hardDelete: boolean = false
) {
  const log = create(`${TAG}:remove`);

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
  const log = create(`${TAG}:missing`);

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
    const file = await parseXCI(filePath, keys.headerKey, getMediaDir());
    log.verbose(`Successfully parsed ${file.displayName()}`);

    return file;
  } catch (error) {
    log.error(`Unable to parse ${filePath}`);
    log.error(error);
  }
}

async function getNSWDBInfo(file: File) {
  const log = create(`${TAG}:nswdb`);
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
  const log = create(`${TAG}:tgdb:${file.titleID}`);
  log.info(`Attempting to download media for ${file.gameName}`);

  const result = await downloadGameMedia(file, 0.01);
  if (!result) {
    log.warn(`Unable to find a match for ${file.gameName}`);
  } else {
    log.info("Successfully downloaded media");
  }
}

async function getEshopInfo(file: File) {
  // const log = create(`${TAG}:eshop`);
}
