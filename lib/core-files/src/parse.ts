import { createLogger, getMediaDir } from "@nxbm/core";
import { IFile } from "@nxbm/types";
import { basename } from "path";

import { getKeys } from "./keys";
import { isNSP, parseNSP } from "./nsp";
import { File } from "./parser/models/File";
import { isXCI, parseXCI } from "./xci";

// TODO - If parsed file is NSP - DLC, get extra data from DB's

export async function parseFile(filePath: string): Promise<IFile | undefined> {
  const log = createLogger(`parse:${basename(filePath)}`);
  const parseFunc = await determineParserFunction(filePath);
  if (!parseFunc) {
    log.error("Unable to parse file");
    return;
  }

  try {
    const result = await parseFunc(filePath);
    return result;
  } catch (error) {
    log.error("Failed to parse file!");
    log.error(`-> ${filePath}`);
    log.error(error);
  }
}

export async function parseXCIFile(
  filePath: string
): Promise<File | undefined> {
  const log = createLogger(`parse:xci:${basename(filePath)}`);
  const keys = await getKeys();
  if (!keys) {
    log.error("Unable to find decryption keys, unable to parse XCI");
    return;
  }

  log.verbose(`Parsing ${filePath}`);
  const { headerKey } = keys;
  const file = await parseXCI(filePath, {
    headerKey,
    outputDir: getMediaDir()
  });
  log.verbose(`Successfully parsed ${file.displayName()}`);

  return file;
}

export async function parseNSPFile(
  filePath: string
): Promise<File | undefined> {
  const log = createLogger(`parse:nsp:${basename(filePath)}`);

  log.verbose(`Parsing ${filePath}`);
  const file = await parseNSP(filePath, {
    headerKey: "TODO - unused",
    outputDir: getMediaDir()
  });
  log.verbose(`Successfully parsed ${file.displayName()}`);

  return file;
}

async function determineParserFunction(filePath: string) {
  const log = createLogger(`parse:${basename(filePath)}`);
  try {
    log.debug("Checking if file is an xci or nsp");
    if (await isXCI(filePath)) {
      log.debug("Dectected an XCI!");
      return parseXCIFile;
    }

    if (await isNSP(filePath)) {
      log.debug("Detected a NSP!");
      return parseNSPFile;
    }

    log.warn("Is an unsupported file type!");
    log.warn("NSP and XCI files are supported!");
    log.warn(
      "Either your file is corrupted, or is an edge-case, enable more verbose logging '--level=debug'"
    );
  } catch (error) {
    log.error("Unable to determine file type");
    log.error(error);
  }

  return;
}
