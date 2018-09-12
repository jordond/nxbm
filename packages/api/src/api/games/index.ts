import {
  Request,
  ResponseToolkit,
  RouteOptionsPreAllOptions,
  ServerRoute
} from "hapi";

import { internal } from "boom";

import { DBRouteHandler } from "..";
import { getGameDB } from "../../files/games/db";
import { applyPreRequest } from "../../util/hapiRoute";
import { routes } from "./games.routes";

export { GameRoutes } from "./games.routes";

const ASSIGN_DB = "GAMES_DB";
const prerequest: RouteOptionsPreAllOptions[] = [
  {
    assign: ASSIGN_DB,
    method: () => getGameDB()
  }
];

export const games: ServerRoute[] = applyPreRequest<DBRouteHandler>(
  prerequest,
  routes,
  (request: Request, r: ResponseToolkit, handler: DBRouteHandler) => {
    if (request.pre[ASSIGN_DB]) {
      return handler({ request, r, db: request.pre[ASSIGN_DB] });
    }

    return internal("Unable to read the game database");
  }
);
