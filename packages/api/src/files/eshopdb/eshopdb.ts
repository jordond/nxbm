import { getGamesAmerica } from "nintendo-switch-eshop";

import { getConfig } from "../../config";
import {
  AutoDownloadJsonDB,
  AutoDownloadJsonDBOptions
} from "../../util/jsondb";
import { GameUS } from "./eshop.types";

export class EShopDB extends AutoDownloadJsonDB<GameUS> {
  constructor(opts?: AutoDownloadJsonDBOptions) {
    super("eshopdb", opts);
  }

  public onGetRefreshInterval() {
    return getConfig().backups.eshop.refreshInterval;
  }

  protected getSearchKey(): string[] {
    return ["title"];
  }

  protected async onDownloadNewDB(): Promise<GameUS[]> {
    this.log.verbose("Downloading games database from the eshop");

    try {
      const results = await getGamesAmerica();
      this.log.verbose(`Downloaded database, found ${results.length} entries`);

      return results;
    } catch (error) {
      this.log.error("Unable to download the eshop database");
      this.log.error(error);
    }

    return [];
  }
}
