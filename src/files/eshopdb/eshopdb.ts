import { getGamesAmerica } from "nintendo-switch-eshop";

import { getConfig } from "../../config";
import { findMultiple, findSingle } from "../../util/fuzzy";
import {
  AutoDownloadJsonDB,
  AutoDownloadJsonDBOptions
} from "../../util/jsondb";

export class EShopDB extends AutoDownloadJsonDB<GameUS> {
  constructor(opts?: AutoDownloadJsonDBOptions) {
    super("eshopdb", opts);
  }

  public find(gameTitle: string): GameUS | undefined {
    return findSingle(this.getData(), gameTitle, { keys: ["title"] });
  }

  public findMany(gameTitle: string, threshold?: number): GameUS[] {
    return findMultiple(this.getData(), gameTitle, {
      threshold,
      keys: ["title"]
    });
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
