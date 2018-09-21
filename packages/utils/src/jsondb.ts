import { createLogger, getDataDir } from "@nxbm/core";
import { readJson } from "fs-extra";
import { resolve } from "path";
import { LoggerInstance } from "winston";

import { outputFormattedJSON } from "./filesystem";
import { findMultiple, findSingle } from "./fuzzy";
import { olderThan, prettyDateTime } from "./misc";

const STALE_HOURS = 24;

export interface DBOptions {
  force: boolean;
  dataDir: string;
}

export interface JsonDB<T> {
  updatedAt?: Date;
  data: T[];
}

export interface AutoDownloadJsonDBOptions {
  outputDir: string;
  refreshInterval: number;
}

export abstract class AutoDownloadJsonDB<T> {
  public db?: JsonDB<T>;
  public log: LoggerInstance;

  private name: string;
  private filename: string;
  private filePath: string = "";
  private refreshInterval?: number;

  constructor(
    name: string,
    {
      outputDir = getDataDir(),
      refreshInterval
    }: Partial<AutoDownloadJsonDBOptions> = {}
  ) {
    this.name = name.toUpperCase();
    this.log = createLogger(this.name);
    this.filename = `${name}.json`;
    this.refreshInterval = refreshInterval;
    this.setOutputDir(outputDir);
  }

  public setOutputDir(dir: string) {
    this.filePath = resolve(dir, this.filename);
  }

  public isOutdated(refreshInterval = this.getRefreshInterval()) {
    return (
      !this.db ||
      !this.db.data.length ||
      !this.db.updatedAt ||
      olderThan(new Date(this.db.updatedAt), refreshInterval)
    );
  }

  public find(search: string, threshold?: number): T | undefined {
    return findSingle(this.getData(), search, {
      threshold,
      keys: this.getSearchKey()
    });
  }

  public findMany(search: string, threshold?: number): T[] {
    return findMultiple(this.getData(), search, {
      threshold,
      keys: this.getSearchKey()
    });
  }

  public getData(): T[] {
    if (this.db && this.db.data) {
      return this.db.data;
    }

    return [];
  }

  public async initDb(force: boolean = false) {
    await this.getJsonDB(force);

    if (!this.db || !this.db.data.length) {
      this.log.error("The database is empty, something went wrong");
    } else {
      this.log.info(
        `Successfully loaded nswdb with [${this.db.data.length}] entries`
      );
    }

    return this;
  }

  protected onGetRefreshInterval(): number | undefined {
    return this.refreshInterval;
  }

  protected abstract onDownloadNewDB(): Promise<T[]>;

  protected abstract getSearchKey(): string[];

  private getRefreshInterval() {
    return this.refreshInterval || this.onGetRefreshInterval() || STALE_HOURS;
  }

  private async getJsonDB(force: boolean = false) {
    if (force) {
      this.log.info("Forcing download of new DB");
      return this.startDownloadAndSaveResult();
    }

    this.db = await this.readFromDisk();
    const updatedAt = this.db.updatedAt ? new Date(this.db.updatedAt) : null;
    if (updatedAt === null || (await this.shouldDownloadNewDB())) {
      this.log.info("Cached DB doesn't exist, or is too old.");
      this.log.info(`Downloading a fresh copy of the ${this.name}`);
      try {
        const result = await this.startDownloadAndSaveResult();
        if (result) {
          return result;
        }
      } catch (error) {
        if (this.db && this.db.data.length) {
          this.log.info("Failed to download new DB, using old version");
          this.log.verbose(error);
        } else {
          this.log.error(
            "Unable to download or find a nswdb! Parsing of files will be incomplete"
          );
          this.log.error(error);
        }
      }
    }
  }

  private shouldDownloadNewDB(): boolean {
    this.log.verbose("Checking if cache needs to be refreshed");

    const isOlder =
      !this.db ||
      !this.db.updatedAt ||
      olderThan(this.db.updatedAt, this.getRefreshInterval());
    this.log.verbose(
      isOlder
        ? `${this.name} is older than ${this.getRefreshInterval()} hours`
        : `${this.name} exists and is new enough!`
    );
    return isOlder;
  }

  private async readFromDisk(): Promise<JsonDB<T>> {
    this.log.info(`Attempting to read ${this.name} from ${this.filePath}`);

    try {
      const result: JsonDB<T> = await readJson(this.filePath);
      this.log.info("Successfully found and read database");
      this.log.verbose(
        `Cache was last updated at ${prettyDateTime(
          new Date(result.updatedAt!)
        )}`
      );
      this.log.verbose(`Found ${result.data.length} games in database`);

      return result;
    } catch (error) {
      this.log.verbose("A cached version does not exist");
      if (error.code !== "ENOENT") {
        this.log.debug(error);
      }
    }

    return { data: [] };
  }

  private async startDownloadAndSaveResult() {
    const data = await this.onDownloadNewDB();

    if (data.length) {
      await this.save(data);
      return;
    }

    this.log.warn("Recieved no data");
  }

  private async save(data: T[]) {
    this.log.verbose(`Attempting to save ${this.name} to ${this.filePath}`);

    try {
      const output: JsonDB<T> = {
        data,
        updatedAt: new Date()
      };

      await outputFormattedJSON(this.filePath, output);
      this.log.info(`Saved ${this.name} to ${this.filePath}`);

      this.db = output;
    } catch (error) {
      this.log.error("Unable to save NSWDB...");
      this.log.error(error);
    }
  }
}
