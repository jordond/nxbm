import axios from "axios";
import { create } from "../../logger";

function getDownloadUrl(apiKey: string) {
  return `https://api.thegamesdb.net/Games/ByPlatformID?id=4971&fields=overview,rating,coop,youtube,players&include=boxart&apikey=${apiKey}`;
}

async function downloadPage(
  url: string,
  result: Partial<DownloadResult> = { games: [], images: {} }
): Promise<DownloadResult> {
  const log = create("tgdb:dl:page");
  log.silly(`Downloading -> ${url}`);

  try {
    const { data } = await axios.get<TGDBResponse>(url);

    const { games } = data.data;
    const { base_url, data: images } = data.include.boxart;
    const merged: DownloadResult = {
      base_url,
      games: [...(result.games ? result.games : []), ...games],
      images: { ...result.images, ...images }
    };

    if (data.pages && data.pages.next) {
      return downloadPage(data.pages.next, merged);
    }

    return merged;
  } catch (error) {
    log.error(`Unable to download ${url}`);
    throw error;
  }
}

export async function downloadGamesDatabase(apiKey: string) {
  const downloadUrl = getDownloadUrl(apiKey);

  return downloadPage(downloadUrl);
}
