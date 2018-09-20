import { createLogger } from "@nxbm/core";
import { Game, IFile } from "@nxbm/types";
import { map } from "bluebird";

import { getEShopDB, getEshopInfo } from "./eshopdb";
import { getTGDBInfo } from "./thegamesdb";

export async function getMissingDetailedInfo(games: Game[]) {
  await getEShopDB();
  return map(games, game => {
    if (!game.file.description) {
      getTGDBInfoForFile(game.file);
    }

    if (!game.file.eshop) {
      getEshopInfoForFile(game.file);
    }
  });
}

export async function getTGDBInfoForFile(file: IFile) {
  const log = createLogger(`info:tgdb:${file.titleID}`);
  try {
    log.verbose(`Gathering extra info from thegamesdb`);
    const result = await getTGDBInfo(file, 0.01);
    if (result) {
      log.verbose("Successfully gathered info");
    } else {
      log.warn(`Failed to get TGDB info for ${file.gameName}`);
    }
  } catch (error) {
    log.error("Failed to get tgdb info");
    log.error(error);
  }
}

export async function getEshopInfoForFile(file: IFile) {
  const log = createLogger(`info:eshop:${file.gameName}`);
  try {
    log.verbose(`Gathering extra info from eshop`);
    const result = await getEshopInfo(file, 0.01);
    if (result) {
      log.verbose("Successfully gathered info");
    } else {
      log.warn(`Failed to get EShop info for ${file.gameName}`);
    }
  } catch (error) {
    log.error("Failed to get eshop info");
    log.error(error);
  }
}
