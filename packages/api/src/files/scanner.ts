import { IBackupConfig } from "@nxbm/types";
import { filter } from "bluebird";
import * as chokidar from "chokidar";
import { pathExists } from "fs-extra";
import { join, resolve } from "path";

import { getConfig } from "../config";
import { create } from "../logger";
import { addFile, markFileAsMissing } from "./games/manager";

const log = create("Scanner");

let scannerInstance: chokidar.FSWatcher | null;

export function scannerIsActive() {
  return scannerInstance !== null;
}

export async function startScanner({
  folders,
  watch,
  recursive
}: IBackupConfig) {
  log.info("Starting scanner...");

  if (!folders.length) {
    log.info("No folders to scan, stopping.");
    return;
  }

  const resolved = folders.map(path => resolve(path));
  const existing = await filter(resolved, verifyFolderExists);

  if (!existing.length) {
    log.warn("None of the specified folders exist...");
    return;
  }

  log.info(`${watch ? "Watching" : "Scanning"} ${existing.length} folders`);

  try {
    await scan(existing, watch, recursive);
    log.info(`${watch ? "Scanner is active" : "Scanning completed"}`);
  } catch (error) {
    log.error("Error starting scanner");
    log.error(error);
    return false;
  }

  return true;
}

export async function restartScanner(
  opts: IBackupConfig = getConfig().backups
) {
  log.info("Restarting scanner...");
  stopScanner();
  return startScanner(opts);
}

export async function stopScanner() {
  if (scannerInstance) {
    log.info("Stopping scanner...");
    scannerInstance.close();
    scannerInstance = null;
    return true;
  }

  return false;
}

function scan(
  paths: string[],
  persistent: boolean = true,
  recursive: boolean = true
): Promise<void> {
  return new Promise((done, reject) => {
    const watchPaths = paths.map(x =>
      join(x, `${recursive ? "**/" : ""}*.(xci|nsp)`)
    );
    watchPaths.forEach(x =>
      log.verbose(`${persistent ? "Watching" : "Scanning"}  -> ${x}`)
    );

    const instance = chokidar
      .watch(watchPaths, { persistent })
      .on("add", (file: string) => addFile(file))
      .on("unlink", (file: string) => markFileAsMissing(file))
      .on("ready", () => done())
      .on("error", error => {
        log.error("Scanner encountered an error");
        log.error(error);
        reject();
      });

    if (persistent) {
      scannerInstance = instance;
    }
  });
}

async function verifyFolderExists(path: string) {
  const exists = await pathExists(path);
  log.debug(`Folder: ${path} -> ${exists ? "exists" : "N/A"}`);
  if (!exists) {
    log.error(`Folder does not exist! -> ${path}`);
  }
  return exists;
}
