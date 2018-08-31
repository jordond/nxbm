import { internal, notFound } from "boom";
import { max } from "compare-semver";
import { DBRouteHandler } from "../";
import { Game } from "../../files/games/gamedb";
import { removeFile } from "../../files/games/manager";
import { hasQuery } from "../../util/hapiExt";
import { queryParams } from "./games.routes";

export const getAllGames: DBRouteHandler = ({ db: { xcis } }) => ({ xcis });

export const getAllGamesByTitleID: DBRouteHandler = ({ request, db }) => {
  const titleid = request.params.titleid;
  const matching = db.findByID(titleid);
  if (!matching.length) {
    return notFound(`No games matching ${titleid} were found`);
  }

  return matching;
};

export const getGameByTitleID: DBRouteHandler = opts => {
  const matched = getAllGamesByTitleID(opts) as Game[];
  if (!Array.isArray(matched)) {
    return matched;
  }

  const { revision } = opts.request.params;
  const latest = (matched as Game[]).map(game => game.file.gameRevision);
  const useRevision = revision ? revision : max(latest);
  const found = matched.find(game => game.file.gameRevision === useRevision);

  if (found) {
    return found;
  }

  return notFound(
    `Unable to find revision: ${revision} for ${opts.request.params.titleid}`
  );
};

export const deleteGameByTitleID: DBRouteHandler = async ({
  request,
  ...rest
}) => {
  const deleteFromDisk = hasQuery(request, queryParams.deleteGame.hardDelete);

  const game = getGameByTitleID({ request, ...rest }) as Game;
  if (!game.file) {
    // Failed to find by id
    return game;
  }

  const deleted = await removeFile(rest.db, game, deleteFromDisk);
  if (!deleted) {
    return internal(`Failed to delete ${game.file.displayName()}`);
  }

  return rest.r.response("ok").code(200);
};
