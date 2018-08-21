import { createReadStream, ensureDir, ensureFile, open } from "fs-extra";
import { tmpdir } from "os";
import { extname, join, resolve } from "path";
import { Extract } from "unzipper";

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
  return join(tmpdir(), "nxbm");
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
