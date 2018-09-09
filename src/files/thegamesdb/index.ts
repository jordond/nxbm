import { getDataDir } from "../../config";
import { create } from "../../logger";
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

// TODO - NEeds to get the info for a file
// use a tight match, and if it cant find it the user must interviene
// set threshold of 0.01?
export async function getTGDBInfo(file: File) {
  const tgdb = await getTGDB();
  tgdb.find(file.gameName);
}
