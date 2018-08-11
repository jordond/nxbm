import axios from "axios";
import { outputJson, readJson } from "fs-extra";
import { resolve } from "path";

import { INSWDBOptions } from "../config";
import { create } from "../logger";
import { format, olderThan, prettyDateTime, youngerThan } from "../util/misc";
import { parseXml } from "../util/xmlToJson";
import { NSWDBCache, ParsedXml, Release } from "./nswdb.types";

const FILENAME = "nswdb.json";
const NSWDB_URL = "http://nswdb.com/xml.php";
const STALE_HOURS = 24;

const log = create("NSWDB");

const cache: NSWDBCache = { db: [] };

export async function getGameDatabase(
  dataDir: string,
  { force = false, refreshInterval = STALE_HOURS }: INSWDBOptions
) {
  const { updatedAt, db } = cache;
  if (
    !force &&
    db.length &&
    updatedAt &&
    youngerThan(updatedAt, refreshInterval)
  ) {
    return db;
  }

  const path = resolve(dataDir, FILENAME);

  const nswdb = await getXmlGamesDatabase(path, { force, refreshInterval });
  if (!nswdb.db.length) {
    log.error("The games database is empty, something went wrong");
  } else {
    log.info(`Successfully loaded nswdb with [${nswdb.db.length}] entries`);
  }

  return nswdb;
}

// TODO - BROKEN
/*
  Download if doesn't exist = works
  Download if exists and old = true
  download if exists and NOT OLD = false
*/
async function getXmlGamesDatabase(
  path: string,
  { force, refreshInterval }: INSWDBOptions
) {
  if (force) {
    log.info("Forcing download of new DB");
    return startDownloadAndSaveResult(path);
  }

  const cached = await readDBJsonFile(path, refreshInterval!);
  if (!cached.updatedAt || shouldDownloadNewDB(cached, refreshInterval!)) {
    log.info("Cached DB is too old, downloading a new NSWDB");
    return startDownloadAndSaveResult(path);
  }

  return cached;
}

async function startDownloadAndSaveResult(path: string): Promise<NSWDBCache> {
  const releases = await downloadNswDBFromWeb();
  return saveDBJsonFile(path, releases);
}

async function readDBJsonFile(
  path: string,
  refreshInterval: number
): Promise<NSWDBCache> {
  log.info(`Attempting to read DB from ${path}`);

  try {
    const result: NSWDBCache = await readJson(path);
    log.info("Successfully found and read database");
    log.verbose(
      `Cache was last updated at ${prettyDateTime(new Date(result.updatedAt!))}`
    );
    log.verbose(`Found ${result.db.length} games in database`);

    return result;
  } catch (error) {
    log.verbose("A cached version does not exist");
    log.debug(error);
  }

  return { db: [] };
}

function shouldDownloadNewDB(
  cached: NSWDBCache,
  refreshInterval: number
): boolean {
  log.verbose("Checking if cache needs to be refreshed");

  const isOlder =
    !cached.updatedAt || olderThan(cached.updatedAt, refreshInterval);
  log.verbose(
    isOlder
      ? `DB is older than ${refreshInterval} hours`
      : "DB exists and is new enough!"
  );
  return isOlder;
}

async function downloadNswDBFromWeb(): Promise<Release[]> {
  try {
    log.verbose(`Fetching XML from ${NSWDB_URL}`);
    const result = await axios.get(NSWDB_URL);
    log.debug(`Response: ${result.status} -> ${result.statusText}`);

    const {
      releases: { release: parsed }
    } = await parseXml<ParsedXml>(result.data, { explicitArray: false });

    if (parsed.length) {
      log.verbose(`Parsed ${parsed.length} items from xml`);
      log.silly(`Parsed output:\n ${format(parsed)}`);
    } else {
      log.warn("Parsing the XML from nswdb.com has failed...");
    }

    return parsed;
  } catch (error) {
    log.error("Unable to download database from nswdb.com");
    log.error(error);
    return [];
  }
}

async function saveDBJsonFile(
  path: string,
  data: Release[]
): Promise<NSWDBCache> {
  log.verbose(`Attempting to save DB to ${path}`);

  try {
    const output: NSWDBCache = {
      updatedAt: new Date(),
      db: data
    };

    await outputJson(path, output, { spaces: 2 });
    log.info(`Saved NSWDB to ${path}`);
    return output;
  } catch (error) {
    log.error("Unable to save NSWDB...");
    log.error(error);
  }
  return { db: [] };
}
