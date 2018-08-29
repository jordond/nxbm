import { pathExists, readJSON } from "fs-extra";
import { resolve } from "path";

import { getDataDir } from "../../config";
import { create } from "../../logger";
import { outputFormattedJSON } from "../../util/filesystem";
import { File } from "../parser/models/File";
import { GameDB, IGameDB } from "./game";

const DB_FILENAME = "gamedb.json";
const log = create("games:db");

let gameDBCache: GameDB;

export async function getGameDB(force: boolean = false): Promise<GameDB> {
  if (!force && gameDBCache) {
    return gameDBCache;
  }

  log.info("Reading games database from the disk");
  const database = await loadGameDB();
  if (database) {
    log.info("Successfully read games database");
    log.info(`Found [${database.xcis.length}] games`);
    gameDBCache = new GameDB(database);
  } else {
    log.warn("Failed to load game db from disk...");
    gameDBCache = new GameDB();
  }

  return gameDBCache;
}

export async function loadGameDB(): Promise<IGameDB | undefined> {
  const path = getGameDBPath();
  log.verbose(`Game database path -> ${path}`);

  if (!(await pathExists(path))) {
    log.verbose("Game database doesn't exist, using empty database");
    return { xcis: [] };
  }

  try {
    const { xcis }: IGameDB = await readJSON(path);
    const result: IGameDB = {
      xcis: xcis.map(({ file, ...rest }) => ({
        ...rest,
        file: new File(file)
      }))
    };

    log.debug(
      `Found Games in database: \n\t${result.xcis
        .map(x => x.file.displayName())
        .join("\n\t")}`
    );

    return result;
  } catch (error) {
    log.error("Unable to read local games database");
    log.error(error);
  }
}

export async function saveGameDB({ xcis }: IGameDB = gameDBCache) {
  const path = getGameDBPath();
  log.verbose(`Attempting to save the game database to ${path}`);
  try {
    await outputFormattedJSON(path, { xcis });
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
