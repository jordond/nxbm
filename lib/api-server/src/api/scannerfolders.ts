import { ScannerFolderRoutes } from "@nxbm/api-endpoints";
import { createLogger, getConfig, saveConfig, updateConfig } from "@nxbm/core";
import { restartScanner } from "@nxbm/core-db";
import { IConfig, ScannerFolder } from "@nxbm/types";
import { hasQuery, safeRemove } from "@nxbm/utils";
import { badData, badRequest, internal, notFound } from "boom";
import { pathExists } from "fs-extra";
import { Lifecycle, Request, ServerRoute } from "hapi";
import uuid = require("uuid");

function getFolders(): Lifecycle.ReturnValue {
  try {
    const config = getConfig();
    return config.backups.folders;
  } catch (error) {
    throw internal("Unable to get config", error);
  }
}

async function postAddFolder(request: Request): Promise<Lifecycle.ReturnValue> {
  const { path, recursive } = request.payload as ScannerFolder;
  const newFolder = {
    path,
    recursive: recursive === undefined ? true : false,
    id: uuid()
  };

  const result = await addOrUpdateFolder(newFolder);
  await tryRestartScanner();
  return result;
}

async function putUpdatefolder(
  request: Request
): Promise<Lifecycle.ReturnValue> {
  const payload = request.payload as ScannerFolder;
  if (!payload.id) {
    throw badRequest("Scanner folder doesn't have an ID");
  }

  const result = await addOrUpdateFolder(payload);
  await tryRestartScanner();
  return result;
}

async function deleteFolder(request: Request): Promise<Lifecycle.ReturnValue> {
  const id = request.params.id;
  const hardDelete = hasQuery(
    request,
    ScannerFolderRoutes.QueryParams.hardDelete
  );
  if (!id) {
    throw badRequest("No id was supplied");
  }

  const config = getConfig();
  const folders = config.backups.folders;
  const found = folders.findIndex(folder => folder.id === id);
  if (found < 0) {
    throw notFound(`Unable to find a folder with the id of ${id}`);
  }

  if (hardDelete) {
    try {
      await safeRemove(folders[found].path, true);
    } catch (error) {
      throw internal(`Unable to delete folder ${folders[found].path}`);
    }
  }

  folders.splice(found, 1);

  await saveFolders(folders);

  return true;
}

async function addOrUpdateFolder(folder: ScannerFolder) {
  const log = createLogger("api:scannerfolder:addupdate");
  const config = getConfig();
  const folders = config.backups.folders;

  await checkPathExists(folder.path);

  const found = folders.findIndex(x => x.id === folder.id);
  if (found > -1) {
    log.debug(
      `Found existing folder, updating => ${folders[found].path} -> ${
        folder.path
      }`
    );
    folders.splice(found, 1, folder);
  } else {
    log.debug(`Adding a new scanner folder -> ${folder.path}`);
    const isDuplicate = folders.map(x => x.path).includes(folder.path);
    if (isDuplicate) {
      throw badData("Folder already exists");
    }
    folders.push(folder);
  }

  await saveFolders(folders);
  return folder;
}

async function checkPathExists(path: string) {
  try {
    const result = await pathExists(path);
    if (result) return true;
  } catch (error) {
    // doesn't exist
  }
  throw badRequest(`Path ${path} does not exist`);
}

async function saveFolders(folders: ScannerFolder[]) {
  const log = createLogger("api:scannerfolder:save");

  const config = getConfig();
  try {
    config.backups.folders = folders;

    updateConfig(config);
  } catch (error) {
    log.error("Failed save scanner folders");
    log.error(error);
    throw badRequest("Config was invalid", error);
  }

  const saved = await saveConfig(config);
  if (!saved) {
    throw internal("Unable to save the config to the disk");
  }
}

async function tryRestartScanner() {
  try {
    await restartScanner(getConfig().backups);
  } catch (error) {
    createLogger("api:scannerfolder:error").error(error);
    throw internal("Unable to restart the scanner with new folders!");
  }
}

const routes = { ...ScannerFolderRoutes.Endpoints };
routes.getFolders.handler = getFolders;
routes.postAddFolder.handler = postAddFolder;
routes.putUpdateFolder.handler = putUpdatefolder;
routes.deleteFolder.handler = deleteFolder;

export default Object.values(routes) as ServerRoute[];
