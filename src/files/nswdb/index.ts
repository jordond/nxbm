import { getDataDir, INSWDBOptions } from "../../config";
import { create } from "../../logger";
import { NSWDB } from "./nswdb";

const cachedDb: NSWDB = new NSWDB();

export async function getNSWDB(
  dataDir: string = getDataDir(),
  { force = false, refreshInterval }: INSWDBOptions = {}
) {
  const log = create("nswdb:init");
  if (!force && !cachedDb.isOutdated(refreshInterval)) {
    log.debug("Using cached version of NSWDB");
    return cachedDb;
  }

  log.debug("Init NSWDB");
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb(force);
}
