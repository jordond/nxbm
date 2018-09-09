import { getDataDir } from "../../config";
import { create } from "../../logger";
import { getGameDB } from "../games/db";
import { File } from "../parser/models/File";
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
  return cachedDb.initDb(force);
}

export async function getEshopInfo(file: File, threshold: number = 0.01) {
  const eshop = await getEShopDB();
  const match = eshop.find(file.gameName, 0.01);

  if (!match) return false;

  const db = await getGameDB();
  file.eshop = match;
  db.update(file);
  db.save();
  return true;
}
