import { createLogger, getDataDir } from "@nxbm/core";
import { File } from "@nxbm/core-files";
import { Game } from "@nxbm/types";
import { outputFormattedJSON } from "@nxbm/utils";
import { pathExists, readJSON } from "fs-extra";
import { resolve } from "path";

import { GameDB } from "./gamedb";

const DB_FILENAME = "gamedb.json";
const log = createLogger("games:db");

let gameDBCache: GameDB;

export async function getGameDB(force: boolean = false): Promise<GameDB> {
  if (!force && gameDBCache) {
    return gameDBCache;
  }

  log.info("Reading games database from the disk");
  const loadedFiles = await loadGameDB();
  if (loadedFiles) {
    log.info("Successfully read games database");
    log.info(`Found [${loadedFiles.length}] games`);
    gameDBCache = new GameDB(loadedFiles);
  } else {
    log.warn("Failed to load game db from disk...");
    gameDBCache = new GameDB();
  }

  return gameDBCache;
}

export async function loadGameDB(): Promise<Game[] | undefined> {
  const path = getGameDBPath();
  log.verbose(`Game database path -> ${path}`);

  if (!(await pathExists(path))) {
    log.verbose("Game database doesn't exist, using empty database");
    return [];
  }

  try {
    const games: Game[] = await readJSON(path);
    const result: Game[] = games.map(({ file, ...rest }) => ({
      ...rest,
      file: new File(file.type, file)
    }));

    log.debug(
      `Found Games in database: \n\t${result
        .map(x => x.file.displayName())
        .join("\n\t")}`
    );

    return result;
  } catch (error) {
    log.error("Unable to read local games database");
    log.error(error);
  }
}

export async function saveGameDB(games: Game[] = gameDBCache.toList()) {
  const path = getGameDBPath();
  log.verbose(`Attempting to save the game database to ${path}`);
  try {
    await outputFormattedJSON(path, games);
    return true;
  } catch (error) {
    log.error("Unable to save the local games database");
    log.error(error);
  }

  return false;
}

export function getGameDBPath(): string {
  return resolve(getDataDir(), DB_FILENAME);
}
