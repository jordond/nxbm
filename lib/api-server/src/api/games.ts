import { badRequest, internal, notFound } from "boom";
import { max } from "compare-semver";
import { Lifecycle, ServerRoute } from "hapi";

import { GameRoutes } from "@nxbm/api-endpoints";
import { getFolders } from "@nxbm/core";
import { getGameDB, removeFile } from "@nxbm/core-db";
import { Game, ScannerFolder } from "@nxbm/types";
import { getQuery, hasQuery } from "@nxbm/utils";

const { Endpoints, QueryParams } = GameRoutes;

async function getDB() {
  try {
    const db = await getGameDB();
    return db;
  } catch (error) {
    throw internal("Unable to get games database");
  }
}

const getAllGames: Lifecycle.Method = async () => {
  const db = await getDB();
  return db.toList();
};

const getAllGamesByTitleID: Lifecycle.Method = async request => {
  const titleid = request.params.titleid;
  const matching = (await getDB()).findByID(titleid);
  if (!matching.length) {
    throw notFound(`No games matching ${titleid} were found`);
  }

  return matching;
};

const getGameByTitleID: Lifecycle.Method = async (request, r) => {
  const matched = (await getAllGamesByTitleID(request, r)) as Game[];
  const revision = getQuery<string>(request, QueryParams.revision);

  const latest = (matched as Game[]).map(game => game.file.gameRevision);
  const useRevision = revision ? revision : max(latest);
  const found = matched.find(game => game.file.gameRevision === useRevision);

  if (!found) {
    throw notFound(
      `Unable to find revision: ${revision} for ${request.params.titleid}`
    );
  }

  return found;
};

const postUploadGame: Lifecycle.Method = async (request, r) => {
  const destinationFolder: string | undefined = ((request.payload as any) || {})
    .destinationFolder;
  if (!destinationFolder) {
    throw badRequest("No destination folder was supplied");
  }

  const destFolder: ScannerFolder | undefined = getFolders().find(
    x => x.id === destinationFolder || x.path === destinationFolder
  );

  if (destFolder) {
    throw badRequest(`Could not find a folder matching ${destinationFolder}`);
  }

  // TODO Upload the file
  console.log((request.payload as any).paths[0].hapi);
  return true;
};

const deleteGameByTitleID: Lifecycle.Method = async (request, r) => {
  const deleteFromDisk = hasQuery(request, QueryParams.hardDelete);

  const db = await getDB();
  const game = (await getGameByTitleID(request, r)) as Game;
  const deleted = await removeFile(db, game, deleteFromDisk);

  if (!deleted) {
    throw internal(`Failed to delete ${game.file.displayName()}`);
  }

  return r.response("ok").code(200);
};

const routes = { ...Endpoints };
routes.getAllGames.handler = getAllGames;
routes.getAllGamesByTitleID.handler = getAllGamesByTitleID;
routes.getGameByTitleID.handler = getGameByTitleID;
routes.postUploadGame.handler = postUploadGame;
routes.deleteGameByTitleID.handler = deleteGameByTitleID;

export default Object.values(routes) as ServerRoute[];
