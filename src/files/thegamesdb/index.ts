import { getDataDir } from "../../config";
import { create } from "../../logger";
import { TGDB } from "./tgdb";

const cachedDb = new TGDB();

export async function getTGDB(dataDir: string = getDataDir()) {
  const log = create("tgdb:init");
  if (!cachedDb.isOutdated()) {
    log.debug("Using cached version of TGDB");
    return cachedDb;
  }

  log.debug("Init TGDB");
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb();
}
