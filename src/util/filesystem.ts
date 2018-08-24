import { createReadStream, ensureDir, ensureFile, open } from "fs-extra";
import * as originalGlob from "glob";
import { tmpdir } from "os";
import { extname, resolve } from "path";
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
