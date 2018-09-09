import * as Bluebird from "bluebird";
import { join } from "path";

import { move, pathExists } from "fs-extra";
import { getMediaDir } from "../../config";
import { create } from "../../logger";
import { tempDir } from "../../util/filesystem";
import { downloadFile } from "../../util/http";
import { getGameDB } from "../games/db";
import { Game } from "../games/gamedb";
import { File } from "../parser/models/File";
import { getTGDB } from "./";

const ARTWORK_FOLDER = "artwork";

export function downloadMissingMedia(games: Game[], threshold: number = 0.02) {
  Bluebird.map(games, async game => {
    const log = create(`media:missing:${game.file.gameName}`);
    const path = getMediaOutputFolder(game.file.titleID);
    log.verbose(`Checking if ${path} exists`);

    const exists = await pathExists(path);
    log.debug(`Media folder exists: ${exists}`);
    return { exists, game };
  })
    .filter(result => !result.exists)
    .map(result => result.game)
    .map(({ file }) => downloadGameMedia(file, threshold));
}

export async function downloadGameMedia(file: File, threshold?: number) {
  const log = create(`media:${file.titleID}`);
  const match = await getMatch(file, threshold);
  if (!match) {
    log.warn(
      `Unable to find a match for ${
        file.gameName
      }, update TGDB or search manually using api`
    );
    return false;
  }

  const imageLinks = match.images;
  if (!Object.keys(imageLinks).length) {
    log.warn(
      `Unable to download media for ${
        file.gameName
      }, unable to find a match from thegamesdb`
    );
    return false;
  }

  log.info(`${file.gameName} Starting media download`);
  const imageDictionary = await downloadMedia(file.titleID, imageLinks);
  if (!imageDictionary) {
    log.error("Something went wrong when downloading media");
    return false;
  }

  return updateGame(file, imageDictionary);
}

async function updateGame(file: File, images: TGDBGameImages) {
  const log = create("media:dl:update");
  try {
    const db = await getGameDB();
    file.media.artwork = images;
    db.update(file);
    return db.save();
  } catch (error) {
    log.error("Failed to update database");
    log.error(error);
  }

  return false;
}

async function getMatch(file: File, threshold?: number) {
  const tgdb = await getTGDB();

  return tgdb.find(file.gameName, threshold);
}

async function downloadMedia(titleid: string, images: TGDBGameImages) {
  const log = create(`media:${titleid}`);

  const result: TGDBGameImages = await Bluebird.map(Object.keys(images), key =>
    downloadMediaSide(titleid, key, images[key])
  ).reduce((acc, curr) => ({ ...acc, ...curr }), {});

  const files = Object.keys(result).reduce(
    (acc, key) => acc + Object.keys(result[key]).length,
    0
  );

  if (files === 0) {
    log.info("Unable to download any images");
    return;
  }

  log.info(`Successfully downloaded ${result.length} images`);

  const tempPath = getMediaTempFolder(titleid);
  await moveMediaFiles(titleid, tempPath);

  return result;
}

function downloadMediaSide(
  titleid: string,
  side: string,
  images: TGDBGameImageSide
): Bluebird<TGDBGameImages> {
  return Bluebird.map(Object.keys(images), async key => ({
    key,
    value: await downloadImageSize(titleid, side, key, images[key])
  }))
    .filter(result => result.value !== "")
    .reduce(
      (acc, curr) => ({
        [side]: {
          ...(acc as any)[side],
          [curr.key]: join(titleid, ARTWORK_FOLDER, curr.value)
        }
      }),
      {}
    );
}

async function downloadImageSize(
  titleid: string,
  side: string,
  size: string,
  url: string
) {
  const log = create(`media:${titleid}:dl`);
  const filename = `${side}-${size}.jpg`;
  const filepath = join(getMediaTempFolder(titleid), filename);

  log.verbose(`Downloading ${filename}...`);
  log.debug(`To ${filepath}`);

  try {
    await downloadFile(url, filepath);
    log.debug(`Downloaded ${filepath}`);
    return filename;
  } catch (error) {
    log.error("Failed to download file...");
    log.error(error);
    return "";
  }
}

function getMediaTempFolder(titleid: string) {
  return join(tempDir(), "media", titleid);
}

function getMediaOutputFolder(titleid: string) {
  return join(getMediaDir(), titleid, ARTWORK_FOLDER);
}

async function moveMediaFiles(titleid: string, path: string) {
  const log = create(`media:${titleid}:move`);
  try {
    const destPath = getMediaOutputFolder(titleid);
    log.verbose(`Moving ${path} to ${destPath}`);

    await move(path, destPath, { overwrite: true });
    log.info(`Successfully moved downloaded media to ${destPath}`);
    return join(destPath, titleid);
  } catch (error) {
    log.error("Failed to move media folder");
    log.error(error);
  }

  return "";
}
