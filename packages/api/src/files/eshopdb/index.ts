import { getDataDir } from "../../config";
import { create } from "../../logger";
import { DBOptions } from "../../util/jsondb";
import { getGameDB } from "../games/db";
import { File } from "../parser/models/File";
import { EShopDB } from "./eshopdb";

const cachedDb = new EShopDB();

export async function getEShopDB({
  force = false,
  dataDir = getDataDir()
}: Partial<DBOptions> = {}) {
  const log = create("eshopdb:init");
  if (!force && !cachedDb.isOutdated()) {
    log.debug("Using cached version of EShopDB");
    return cachedDb;
  }

  log.debug("Init EShopDB");
  cachedDb.setOutputDir(dataDir);
  return cachedDb.initDb(force);
}

export async function getEshopInfo(file: File, threshold: number = 0.01) {
  const eshop = await getEShopDB();
  const match = eshop.find(file.gameName, threshold);

  if (!match) {
    create("eshop").warn(
      `Unable to find a close enough match for ${file.gameName}`
    );

    return false;
  }

  const db = await getGameDB();
  file.eshop = match;
  db.update(file);
  db.save();
  return true;
}
