import { getDataDir } from "../../config";
import { create } from "../../logger";
import { getGameDB } from "../games/db";
import { File } from "../parser/models/File";
import { TGDB } from "./tgdb";

export * from "./media";

const cachedDb = new TGDB();

export async function getTGDB({
  force = false,
  dataDir = getDataDir()
}: Partial<DBOptions> = {}) {
  const log = create("tgdb:init");
  if (!force && !cachedDb.isOutdated()) {
    log.debug("Using cached version of TGDB");
    return cachedDb;
  }

  log.debug("Init TGDB");
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb(force);
}

export async function getTGDBInfo(file: File, threshold: number = 0.01) {
  const tgdb = await getTGDB();
  const match = tgdb.find(file.gameName, 0.01);

  if (!match) return false;

  const db = await getGameDB();
  file.assignTGDB(match);
  db.update(file);
  db.save();
  return true;
}
