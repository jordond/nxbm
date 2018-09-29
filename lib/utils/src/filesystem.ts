import { createLogger } from "@nxbm/core";
import {
  createReadStream,
  ensureDir,
  ensureFile,
  open,
  outputJSON,
  remove
} from "fs-extra";
import * as originalGlob from "glob";
import { tmpdir } from "os";
import { extname, resolve } from "path";
import * as recursiveReaddir from "recursive-readdir";
import { Extract } from "unzipper";
import { promisify } from "util";

const glob = promisify(originalGlob);

export async function ensureOpen(path: string, flags: string): Promise<number> {
  const resolvedPath = resolve(path);
  await ensureFile(resolvedPath);

  return open(path, flags);
}

export function ensureOpenRead(path: string) {
  return ensureOpen(path, "r");
}

export function ensureOpenWrite(path: string) {
  return ensureOpen(path, "w");
}

export function tempDir(): string {
  return resolve(tmpdir(), "nxbm");
}

export function unzip(file: string, destination: string) {
  return new Promise(async (finish, reject) => {
    if (extname(file) !== ".zip") {
      return reject(`Filename does not end in '.zip' -> ${file}`);
    }

    await ensureDir(destination);

    createReadStream(file)
      .pipe(Extract({ path: destination }))
      .on("error", (err: any) => reject(err))
      .on("close", () => finish());
  });
}

export function findFilesByName(folder: string, name: string) {
  return glob(resolve(folder, `*${name}*`));
}

export async function findFirstFileByName(folder: string, name: string) {
  if (folder === "") {
    return "";
  }
  const results = await findFilesByName(folder, name);
  return results.length ? results[0] : "";
}

export function outputFormattedJSON(path: string, data: any) {
  return outputJSON(path, data, { spaces: 2 });
}

export async function safeRemove(path: string, throws: boolean = false) {
  const log = createLogger("filesystem:remove");
  try {
    log.verbose(`Deleting ${path}`);
    await remove(path);

    log.verbose(`Successfully deleted ${path}`);
    return true;
  } catch (error) {
    log.error(`Unable to delete ${path}`);
    log.error(error);

    if (throws) {
      throw error;
    }
  }

  return false;
}

export function getFileTree(path: string) {
  return recursiveReaddir(resolve(path));
}
