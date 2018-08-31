import { getDataDir } from "../../config";
import { create } from "../../logger";
import { EShopDB } from "./eshopdb";

const cachedDb = new EShopDB();

export async function getEShopDB(dataDir: string = getDataDir()) {
  const log = create("eshopdb:init");
  if (!cachedDb.isOutdated()) {
    log.debug("Using cached version of EShopDB");
    return cachedDb;
  }

  log.debug("Init EShopDB");
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb();
}
