import { ServerRoute } from "hapi";

import { Game } from "../../files";
import { DELETE, GET } from "../../util/hapiRoute";
import { Route } from "../route";
import {
  deleteGameByTitleID,
  getAllGames,
  getAllGamesByTitleID,
  getGameByTitleID
} from "./games.handler";

export enum QueryParams {
  revision = "revision",
  hardDelete = "hardDelete"
}

export abstract class GameRoutes extends Route {
  public abstract getAllGames: () => Promise<{ xcis: Game[] }>;
  public abstract getAllGamesByTitleID: (titleid: number) => Promise<Game[]>;
  public abstract getGameByTitleID: (
    titleid: number,
    revision?: string
  ) => Promise<Game>;
  public abstract deleteGameByTitleID: (
    titleid: number,
    revision?: string,
    hardDelete?: boolean
  ) => Promise<void>;

  protected endpointName = "/games";
}

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
    path: "/games/{titleid}/single",
    handler: getGameByTitleID
  },
  {
    method: DELETE,
    path: "/games/{titleid}",
    handler: deleteGameByTitleID
  }
];
