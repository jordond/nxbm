import { getDataDir } from "../../config";
import { create } from "../../logger";
import { TGDB } from "./tgdb";

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
  return cachedDb.initDb();
}
