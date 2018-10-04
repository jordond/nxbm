import { createLogger, getConfig } from "@nxbm/core";
import {
  downloadFile,
  getJSON,
  isWindows,
  outputFormattedJSON,
  tempDir,
  unzip
} from "@nxbm/utils";
import { exec as tmpExec } from "child_process";
import * as compare from "compare-semver";
import {
  emptyDir,
  ensureDir,
  move,
  pathExists,
  readJson,
  rename
} from "fs-extra";
import { basename, dirname, join, resolve } from "path";
import { promisify } from "util";

import { HactoolVersion } from "./version";

const exec = promisify(tmpExec);

const TAG = "hactool";

const GIT_ROOT = "https://github.com";
const HACTOOL_ROOT = `${GIT_ROOT}/SciresM/hactool`;
const LATEST_TAG = `${HACTOOL_ROOT}/releases/latest`;
const HACTOOL_DIR = "hactool";
const HACTOOL_NAME = `hactool${isWindows() ? ".exe" : ""}`;
const HACTOOL_VERSION = "version.json";

const generateDownloadURL = (tag: string) =>
  `${HACTOOL_ROOT}${
    isWindows()
      ? `/releases/download/${tag}/hactool-${tag}.win.zip`
      : `/archive/${tag}.zip`
  }`;

const genHactoolFolder = (dataDir: string, extra: string = "") =>
  resolve(dataDir, HACTOOL_DIR, extra);

export function hactoolBinary(
  dataDirectory: string = getConfig().paths!.data
): string {
  return genHactoolFolder(dataDirectory, HACTOOL_NAME);
}

export async function ensureHactool(
  dataDirectory: string,
  downloadIfMissing: boolean = true
): Promise<boolean> {
  const log = createLogger(TAG);
  const path = genHactoolFolder(dataDirectory, HACTOOL_NAME);
  log.info(`Looking for ${HACTOOL_NAME}`);
  log.verbose(`In ${path}`);

  const exists = await pathExists(path);
  if (exists) {
    log.verbose("Hactool was found! Checking it's version");
    if (!(await shouldDownloadNewVersion(dataDirectory))) {
      // No new version
      return true;
    }
  } else if (!downloadIfMissing) {
    return false;
  }

  return downloadHactool(path);
}

async function downloadHactool(path: string) {
  const log = createLogger(`${TAG}:dl`);
  try {
    const result = await downloadHactoolVersion(path);
    emptyDir(tempDir());

    return result;
  } catch (error) {
    log.error(`Failed to get hactool`);
    log.error(error);
    return false;
  }
}

async function getExistingVersion(dataDir: string) {
  try {
    const version: HactoolVersion = await readJson(
      genHactoolFolder(dataDir, HACTOOL_VERSION)
    );
    return version;
  } catch (error) {
    return;
  }
}

async function shouldDownloadNewVersion(dataDirectory: string) {
  const log = createLogger(`${TAG}:version`);
  const version = await getExistingVersion(dataDirectory);
  if (version) {
    log.verbose(`Found existing version ${version.tag} on the disk`);
    log.debug("Checking if there is a newer version available");

    const latest = await getLatestHactoolVersion();
    const newest = compare.max([version.tag, latest]);
    if (newest === version.tag) {
      log.verbose("Local version is up to date!");
      return false;
    }
    log.info(`Newer version of hactool:${newest} is available!`);
  }

  return true;
}

async function getLatestHactoolVersion(): Promise<string> {
  const log = createLogger(`${TAG}:latest`);
  log.debug(`Fetching latest tag from ${LATEST_TAG}`);
  const { data } = await getJSON(LATEST_TAG);
  if (data && data.tag_name) {
    log.verbose(`Latest tag is ${data.tag_name}`);
    return data.tag_name;
  }

  throw new Error("Unable to fetch the latest hactool version");
}

async function moveBinary(source: string, destination: string) {
  const log = createLogger(`${TAG}:move`);
  const finalOutput = resolve(destination);
  log.verbose(`Moving hactool to ${finalOutput}`);

  try {
    await move(source, finalOutput, { overwrite: true });
    return true;
  } catch (error) {
    log.error("Failed to move hactool binary");
    log.error(error);
    return false;
  }
}

async function compileHactool(path: string) {
  const log = createLogger(`${TAG}:compile`);
  const makeLog = createLogger("hactool:make");
  makeLog.info("Attempting to compile hactool, this might take awhile...");

  try {
    await rename(join(path, "config.mk.template"), join(path, "config.mk"));
    const { stdout, stderr } = await exec("make", { cwd: path });

    makeLog.silly(`stderr: ${stderr}`);
    makeLog.silly(`stdout: ${stdout}`);
    return true;
  } catch (error) {
    log.error("Failed to compile hactool!");
    log.error(error);
    return false;
  }
}

async function handleDownloadedFile(
  zipFile: string,
  finalDestination: string,
  tag: string
) {
  const log = createLogger(`${TAG}:zip`);
  log.info(`Unzipping ${zipFile}`);
  try {
    const zipOutput = join(tempDir(), "hactool");
    log.debug(`Unzipping to ${zipOutput}`);
    await unzip(zipFile, zipOutput);

    if (!isWindows()) {
      const fullPath = join(zipOutput, `hactool-${tag}`);
      const compiled = await compileHactool(fullPath);
      if (!compiled) {
        return false;
      }

      return moveBinary(join(fullPath, "hactool"), finalDestination);
    }

    return moveBinary(join(zipOutput, HACTOOL_NAME), finalDestination);
  } catch (error) {
    log.error("Failed to unzip hactool");
    log.error(error);
    return false;
  }
}

async function downloadHactoolVersion(
  finalDestination: string,
  version?: string
) {
  const log = createLogger(`${TAG}:download`);
  const tag = version || (await getLatestHactoolVersion());
  const downloadUrl = generateDownloadURL(tag);
  log.info(`Downloading ${basename(downloadUrl)}`);
  log.verbose(`from ${downloadUrl}`);

  await ensureDir(tempDir());

  const destination = join(tempDir(), `${HACTOOL_NAME}.zip`);
  log.verbose(`saving file to ${destination}`);

  try {
    await downloadFile(downloadUrl, destination);
    const handled = await handleDownloadedFile(
      destination,
      finalDestination,
      tag
    );

    if (handled) {
      const versionData: HactoolVersion = { tag, downloaded: new Date() };
      await outputFormattedJSON(
        join(dirname(finalDestination), HACTOOL_VERSION),
        versionData
      );
    }

    return handled;
  } catch (error) {
    log.error("Failed to download latest hactool");
    log.error(error);
  }
  return false;
}
