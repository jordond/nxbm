import { filter } from "bluebird";
import * as chokidar from "chokidar";
import { pathExists } from "fs-extra";
import { join, resolve } from "path";

import { IBackupConfig } from "../config";
import { create } from "../logger";

const log = create("Scanner");

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

  await scan(existing, watch, recursive);
  log.info(`${watch ? "Scanner is active" : "Scanning completed"}`);
}

function scan(
  paths: string[],
  persistent: boolean = true,
  recursive: boolean = true
): Promise<void> {
  return new Promise(done => {
    const watchPaths = paths.map(x =>
      join(x, `${recursive ? "**/" : ""}*.(xci|nsp)`)
    );
    watchPaths.forEach(x =>
      log.verbose(`${persistent ? "Watching" : "Scanning"}  -> ${x}`)
    );

    chokidar
      .watch(watchPaths, { persistent })
      .on("add", file => log.debug(`add -> ${file}`))
      .on("unlink", file => log.debug(`remove -> ${file}`))
      .on("ready", () => done());
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
