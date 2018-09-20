import { createLogger, getDataDir } from "@nxbm/core";
import { INSWDBOptions } from "@nxbm/types";

import { NSWDB } from "./nswdb";

let cachedDb: NSWDB;

export async function getNSWDB(
  dataDir: string = getDataDir(),
  { force = false, refreshInterval }: INSWDBOptions = {}
) {
  const log = createLogger("nswdb:init");
  if (cachedDb && !force && !cachedDb.isOutdated(refreshInterval)) {
    log.debug("Using cached version of NSWDB");
    return cachedDb;
  }

  log.debug("Init NSWDB");
  cachedDb = new NSWDB();
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb(force);
}
