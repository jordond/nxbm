import { ServerRoute } from "hapi";

import { DELETE, GET } from "../../util/hapiRoute";
import {
  deleteGameByTitleID,
  getAllGames,
  getAllGamesByTitleID,
  getGameByTitleID,
  getMediaLinks
} from "./games.handler";

export const queryParams = {
  deleteGame: {
    hardDelete: "hardDelete"
  }
};

export const routes: ServerRoute[] = [
  {
    method: GET,
    path: "/games",
    handler: getAllGames
  },
  {
    method: GET,
    path: "/games/{titleid}",
    handler: getAllGamesByTitleID
  },
  {
    method: GET,
    path: "/games/{titleid}/revision/{revision?}",
    handler: getGameByTitleID
  },
  {
    method: GET,
    path: "/games/{titleid}/media",
    handler: getMediaLinks
  },
  {
    method: DELETE,
    path: "/games/{titleid}/revision/{revision?}",
    handler: deleteGameByTitleID
  }
];
