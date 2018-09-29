import { createLogger, getConfig } from "@nxbm/core";
import { downloadFile, getJSON, isWindows, tempDir, unzip } from "@nxbm/utils";
import { exec as tmpExec } from "child_process";
import { emptyDir, ensureDir, move, pathExists, rename } from "fs-extra";
import { basename, join, resolve } from "path";
import { promisify } from "util";

const exec = promisify(tmpExec);

const GIT_ROOT = "https://github.com";
const HACTOOL_ROOT = `${GIT_ROOT}/SciresM/hactool`;
const LATEST_TAG = `${HACTOOL_ROOT}/releases/latest`;
const HACTOOL_NAME = `hactool${isWindows() ? ".exe" : ""}`;

const generateDownloadURL = (tag: string) =>
  `${HACTOOL_ROOT}${
    isWindows()
      ? `/releases/download/${tag}/hactool-${tag}.win.zip`
      : `/archive/${tag}.zip`
  }`;

const log = createLogger("hactool");

export function hactoolBinary(
  dataDirectory: string = getConfig().paths!.data
): string {
  return resolve(dataDirectory, "hactool", HACTOOL_NAME);
}

export async function ensureHactool(
  dataDirectory: string,
  downloadIfMissing: boolean = true
): Promise<boolean> {
  const path = resolve(dataDirectory, "hactool", HACTOOL_NAME);
  log.info(`Looking for ${HACTOOL_NAME}`);
  log.verbose(`In ${path}`);

  const exists = await pathExists(path);
  if (exists) {
    log.verbose("Hactool was found!");
    return true;
  }

  if (!downloadIfMissing) {
    return false;
  }

  try {
    const result = await downloadLatestVersion(path);
    emptyDir(tempDir());

    return result;
  } catch (error) {
    log.error(`Failed to get hactool`);
    log.error(error);
    return false;
  }
}

async function getLatestHactoolVersion(): Promise<string> {
  log.debug(`Fetching latest tag from ${LATEST_TAG}`);
  const { data } = await getJSON(LATEST_TAG);
  if (data && data.tag_name) {
    log.verbose(`Latest tag is ${data.tag_name}`);
    return data.tag_name;
  }

  throw new Error("Unable to fetch the latest hactool version");
}

async function moveBinary(source: string, destination: string) {
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

async function downloadLatestVersion(finalDestination: string) {
  const tag = await getLatestHactoolVersion();
  const downloadUrl = generateDownloadURL(tag);
  log.info(`Downloading ${basename(downloadUrl)}`);
  log.verbose(`from ${downloadUrl}`);

  // Ensure download folder exists
  await ensureDir(tempDir());

  const destination = join(tempDir(), `${HACTOOL_NAME}.zip`);
  log.verbose(`saving file to ${destination}`);

  try {
    await downloadFile(downloadUrl, destination);
    return handleDownloadedFile(destination, finalDestination, tag);
  } catch (error) {
    log.error("Failed to download latest hactool");
    log.error(error);
  }
  return false;
}
