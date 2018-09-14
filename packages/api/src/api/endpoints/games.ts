import { GameRoutes } from "@nxbm/endpoints";
import { internal, notFound } from "boom";
import { max } from "compare-semver";
import { Lifecycle, ServerRoute } from "hapi";

import { getGameDB } from "../../files/games/db";
import { Game } from "../../files/games/gamedb";
import { removeFile } from "../../files/games/manager";
import { getQuery, hasQuery } from "../../util/hapiExt";

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
  return { xcis: db.xcis };
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
routes.deleteGameByTitleID.handler = deleteGameByTitleID;

export default Object.values(routes) as ServerRoute[];
