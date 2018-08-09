import { filter } from "bluebird";
import chokidar from "chokidar";
import { pathExists } from "fs-extra";
import { basename, join, resolve } from "path";

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

  log.info(`Watching ${folders.length} folders`);

  const resolved = folders.map(path => resolve(path));
  const existing = await filter(resolved, verifyFolderExists);

  scan(existing, watch, recursive);

  return existing.length;
}

function scan(
  paths: string[],
  persistent: boolean = true,
  recursive: boolean = true
) {
  const watchPaths = paths.map(x =>
    join(x, `${recursive ? "**/" : ""}*.(xci|nsp)`)
  );
  watchPaths.forEach(x => log.verbose(`Watching -> ${x}`));

  chokidar
    .watch(watchPaths, { persistent })
    .on("ready", () => log.verbose(`ready`))
    .on("add", file => log.debug(`add -> ${file}`))
    .on("unlink", file => log.debug(`remove -> ${file}`));
}

async function verifyFolderExists(path: string) {
  const exists = await pathExists(path);
  log.debug(`Folder: ${path} -> ${exists ? "exists" : "N/A"}`);
  if (!exists) {
    log.error(`Folder does not exist! -> ${path}`);
  }
  return exists;
}
