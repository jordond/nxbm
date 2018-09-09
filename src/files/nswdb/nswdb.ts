import fetch from "node-fetch";

import { getConfig } from "../../config";
import {
  AutoDownloadJsonDB,
  AutoDownloadJsonDBOptions
} from "../../util/jsondb";
import { format } from "../../util/misc";
import { parseXml } from "../../util/xmlToJson";
import { ParsedXml, Release } from "./nswdb.types";

const NSWDB_URL = "http://nswdb.com/xml.php";

export class NSWDB extends AutoDownloadJsonDB<Release> {
  constructor(opts: Partial<AutoDownloadJsonDBOptions> = {}) {
    super("nswdb", opts);
  }

  protected getSearchKey(): string[] {
    return ["titleid"];
  }

  protected onGetRefreshInterval() {
    return getConfig().backups.nswdb.refreshInterval;
  }

  protected async onDownloadNewDB(): Promise<Release[]> {
    try {
      this.log.verbose(`Fetching XML from ${NSWDB_URL}`);

      // TODO - Node fetch is required, because Axios is failing for this website
      const result = await fetch(NSWDB_URL);
      this.log.debug(`Response: ${result.status} -> ${result.statusText}`);

      const resultData = await result.text();
      const {
        releases: { release: parsed }
      } = await parseXml<ParsedXml>(resultData, { explicitArray: false });

      if (parsed.length) {
        this.log.verbose(`Parsed ${parsed.length} items from xml`);
        this.log.silly(`Parsed output:\n ${format(parsed)}`);
      } else {
        this.log.warn("Parsing the XML from nswdb.com has failed...");
      }

      return parsed;
    } catch (error) {
      this.log.error("Unable to download database from nswdb.com");
      this.log.error(error);
      return [];
    }
  }
}
