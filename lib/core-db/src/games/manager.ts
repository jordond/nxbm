import { createLogger, getConfig } from "@nxbm/core";
import { parseFile } from "@nxbm/core-files";
import { Game, IFile, IGameDB } from "@nxbm/types";
import { safeRemove } from "@nxbm/utils";

import { getEshopInfoForFile, getTGDBInfoForFile } from "../info";
import { getNSWDB } from "../nswdb";
import { downloadGameMedia, hasDownloadedMedia } from "../thegamesdb/media";
import { addToBlacklist, isBlacklisted } from "./blacklist";
import { getGameDB } from "./db";
import { processDLC } from "./dlc";

const TAG = "games";

export async function addFile(filePath: string) {
  const log = createLogger(`${TAG}:add`);

  const db = await getGameDB();
  const foundFilename = db.findByFileName(filePath);

  if (foundFilename) {
    log.info(
      `Skipping ${foundFilename.file.displayName()}, matched filename to an existing file`
    );
    return foundFilename;
  }

  let parsed = await parseFile(filePath);
  if (!parsed) return;

  // TODO - If its a DLC, try to find info from the LocalDB (titleid), or the NSWDB
  if (parsed.isDLC()) {
    const processedDLC = await processDLC(parsed);
    if (processedDLC) {
      parsed = processedDLC;
    }
  }

  // Try to find game in the DB by its TitleID
  const foundTitleid = db.find(parsed);
  if (foundTitleid) {
    log.info(
      `Skipping ${foundTitleid.file.displayName()}, matched TitleID to an exsiting file`
    );
    return foundTitleid;
  }

  if (await isBlacklisted(parsed)) {
    log.info(`${parsed.displayName()} is on the blacklist, skipping`);
    return;
  }

  // TODO - Check to see if the titleIDBaseGame exists in the DB, and grab their info
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

async function getNSWDBInfo(file: IFile) {
  const log = createLogger(`${TAG}:nswdb`);
  const nswdb = await getNSWDB();
  const release = nswdb.find(file.titleID);
  if (release) {
    log.info(`Found a match in the scene db: ${release.releasename}`);
    file.assignRelease(release);
  } else {
    log.warn(
      `Unable to find a matching game in the scene db: ${file.displayName()}`
    );
  }
}

async function getGameMedia(file: IFile) {
  const log = createLogger(`${TAG}:tgdb:${file.titleID}`);
  log.info(`Attempting to download media for ${file.gameName}`);

  if (await hasDownloadedMedia(file)) {
    log.info(`Downloaded media for ${file.titleIDBaseGame} already exists`);
    return;
  }

  const result = await downloadGameMedia(file, 0.01);
  if (!result) {
    log.warn(`Unable to find a match for ${file.gameName}`);
  } else {
    log.info("Successfully downloaded media");
  }
}
