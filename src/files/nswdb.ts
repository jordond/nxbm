import axios from "axios";
import { outputJson, readJson } from "fs-extra";
import { resolve } from "path";

import { INSWDBOptions } from "../config";
import { create } from "../logger";
import { format, olderThan, prettyDateTime, youngerThan } from "../util/misc";
import { parseXml } from "../util/xmlToJson";
import { NSWDBCache, ParsedXml, Release } from "./nswdb.types";
import { File } from "./parser/models/File";

const FILENAME = "nswdb.json";
const NSWDB_URL = "http://nswdb.com/xml.php";
const STALE_HOURS = 24;

const log = create("NSWDB");

let cache: NSWDBCache = {
  releases: [],
  find: (file: File) => findGameFromDB(cache.releases, file)
};

function findGameFromDB(
  db: Release[],
  { titleID, version }: File
): Release | undefined {
  return db.find(
    release =>
      release.titleid === titleID() &&
      release.firmware.toLowerCase() === version
  );
}

export async function getGameDatabase(
  dataDir: string,
  { force = false, refreshInterval = STALE_HOURS }: INSWDBOptions = {}
) {
  const { updatedAt, releases } = cache;
  if (
    !force &&
    releases.length &&
    updatedAt &&
    youngerThan(new Date(updatedAt), refreshInterval)
  ) {
    return cache;
  }

  const path = resolve(dataDir, FILENAME);

  const nswdb = await getXmlGamesDatabase(path, { force, refreshInterval });
  if (!nswdb.releases || !nswdb.releases.length) {
    log.error("The games database is empty, something went wrong");
  } else {
    log.info(
      `Successfully loaded nswdb with [${nswdb.releases.length}] entries`
    );
    cache = { ...cache, ...nswdb };
  }

  return cache;
}

async function getXmlGamesDatabase(
  path: string,
  { force, refreshInterval }: INSWDBOptions
) {
  if (force) {
    log.info("Forcing download of new DB");
    return startDownloadAndSaveResult(path);
  }

  const cached = await readDBJsonFile(path!);
  const updatedAt = cached.updatedAt ? new Date(cached.updatedAt) : null;
  if (
    updatedAt === null ||
    (await shouldDownloadNewDB(updatedAt, refreshInterval!))
  ) {
    log.info("Cached DB doesn't exist, or is too old.");
    log.info("Downloading a fresh copy of the NSWDB");
    return startDownloadAndSaveResult(path);
  }

  return cached;
}

async function startDownloadAndSaveResult(
  path: string
): Promise<Partial<NSWDBCache>> {
  const releases = await downloadNswDBFromWeb();

  return saveDBJsonFile(path, releases);
}

async function readDBJsonFile(path: string): Promise<Partial<NSWDBCache>> {
  log.info(`Attempting to read DB from ${path}`);

  try {
    const result: NSWDBCache = await readJson(path);
    log.info("Successfully found and read database");
    log.verbose(
      `Cache was last updated at ${prettyDateTime(new Date(result.updatedAt!))}`
    );
    log.verbose(`Found ${result.releases.length} games in database`);

    return result;
  } catch (error) {
    log.verbose("A cached version does not exist");
    log.debug(error);
  }

  return { releases: [] };
}

function shouldDownloadNewDB(
  updatedAt?: Date,
  refreshInterval: number = STALE_HOURS
): boolean {
  log.verbose("Checking if cache needs to be refreshed");

  const isOlder = !updatedAt || olderThan(updatedAt, refreshInterval);
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
): Promise<Partial<NSWDBCache>> {
  log.verbose(`Attempting to save DB to ${path}`);

  try {
    const output: Partial<NSWDBCache> = {
      updatedAt: new Date(),
      releases: data
    };

    await outputJson(path, output, { spaces: 2 });
    log.info(`Saved NSWDB to ${path}`);
    return output;
  } catch (error) {
    log.error("Unable to save NSWDB...");
    log.error(error);
  }
  return { releases: [] };
}
