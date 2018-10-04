import { getConfig } from "@nxbm/core";
import { DownloadResult, TGDBGame } from "@nxbm/types";
import { AutoDownloadJsonDB, AutoDownloadJsonDBOptions } from "@nxbm/utils";

import { downloadGamesDatabase } from "./gamesdbapi";

/**
 * This is a public API key for thegamesdb.net
 * It is rate limited to 300 hits a month per IP address
 *
 * You can request your own on their website, and get a private key
 * that is good for 6000 requests a month
 */
const DEFAULT_API_KEY =
  "8710746de8156566b0f72f883f27383fa223b9419b939142350b3c980fdd8ac0";

export class TGDB extends AutoDownloadJsonDB<TGDBGame> {
  constructor(opts: Partial<AutoDownloadJsonDBOptions> = {}) {
    super("tgdb", opts);
  }

  public onGetRefreshInterval() {
    return getConfig().backups.tgdb.refreshInterval;
  }

  protected getSearchKey(): string[] {
    return ["game_title"];
  }

  protected async onDownloadNewDB(): Promise<TGDBGame[]> {
    const apikey = getConfig().backups.tgdb.apikey || DEFAULT_API_KEY;
    this.log.verbose(`Fetching thegamesdb using the apikey: ${apikey}`);

    try {
      const result = await downloadGamesDatabase(apikey);
      if (result) {
        this.log.verbose(`Downloaded db with ${result.games.length} games`);
        return formatDownloadResult(result);
      }
    } catch (error) {
      this.log.error("Failed to download database from thegamesdb.net");
      this.log.error(error.message);
    }
    return [];
  }
}

function formatDownloadResult(result: DownloadResult): TGDBGame[] {
  return result.games.map(game => {
    const image = result.images[game.id] || [];
    const urls = image.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.side]: Object.keys(result.base_url).reduce(
          (obj, key) => ({
            ...obj,
            [key]: `${(result.base_url as any)[key]}${curr.filename}`
          }),
          {}
        )
      }),
      {}
    );

    return {
      ...game,
      youtube: (game.youtube || "").replace(
        /https:\/\/www\.youtube\.com\/watch\?v\=|https:\/\/youtu\.be\//,
        ""
      ),
      images: urls
    };
  });
}
