import { getConfig } from "@nxbm/core";
import { GameUS } from "@nxbm/types";
import { AutoDownloadJsonDB, AutoDownloadJsonDBOptions } from "@nxbm/utils";
import { getGamesAmerica } from "nintendo-switch-eshop";

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
