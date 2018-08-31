import { getDataDir } from "../../config";
import { create } from "../../logger";
import { EShopDB } from "./eshopdb";

let cachedDb: EShopDB;

export async function getEShopDB({
  force = false,
  dataDir = getDataDir()
}: Partial<DBOptions> = {}) {
  const log = create("eshopdb:init");
  if (cachedDb && !force && !cachedDb.isOutdated()) {
    log.debug("Using cached version of EShopDB");
    return cachedDb;
  }

  log.debug("Init EShopDB");
  cachedDb = new EShopDB();
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb();
}
