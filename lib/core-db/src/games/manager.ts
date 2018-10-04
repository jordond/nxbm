import { createLogger, getConfig } from "@nxbm/core";
import { File, parseFile } from "@nxbm/core-files";
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

  // TODO - Verify the file size matches == same file
  if (foundFilename && !foundFilename.missing) {
    log.info(
      `Skipping ${foundFilename.file.displayName()}, matched filename to an existing file`
    );
    return foundFilename;
  }

  if (foundFilename && foundFilename.missing) {
    log.info(
      `Welcome back ${foundFilename.file.displayName()}! Missing file has been added again`
    );
    db.markMissing(foundFilename, false);
    db.save();
    return foundFilename;
  }

  let parsed = await parseFile(filePath);
  if (!parsed) return;

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
  const existingParent = db.findByID(parsed.titleIDBaseGame)[0];
  if (existingParent) {
    log.info(
      `Found meta-data from an existing parent game ${existingParent.file.id()}`
    );
    mergeExistingMetaData(existingParent.file, parsed);
  } else {
    await getNSWDBInfo(parsed);

    const { backups } = getConfig();
    if (backups.downloadGameMedia) {
      await getGameMedia(parsed);
    }

    if (backups.getDetailedInfo) {
      await Promise.all([
        getTGDBInfoForFile(parsed),
        getEshopInfoForFile(parsed)
      ]);
    }
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
    db.markMissing(found);
    db.save();
    return true;
  }

  log.debug(`File must have been deleted by the user`);
  return false;
}

function mergeExistingMetaData(existing: IFile, newData: IFile) {
  const whitelist = [
    "filepath",
    "totalSizeBytes",
    "usedSizeBytes",
    "titleIDBaseGame",
    "sdkVersion",
    "firmware",
    "carttype",
    "distributionType",
    "contentType",
    "version",
    "titleID",
    "masterKeyRevision"
  ];

  const parent = new File(newData.type, { ...existing });
  newData.assign(
    {
      ...parent.assign(newData)
    },
    { whitelist, truthy: true }
  );
}

async function getNSWDBInfo(file: IFile) {
  const log = createLogger(`${TAG}:nswdb`);
  const nswdb = await getNSWDB();
  const release = nswdb.find(file.titleID) || nswdb.find(file.titleIDBaseGame);
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
