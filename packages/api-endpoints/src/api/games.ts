import { DELETE, Game, GET } from "@nxbm/types";

import { Endpoint, Route } from "../route";

enum GameQueryParams {
  revision = "revision",
  hardDelete = "hardDelete"
}

interface IGameRoutes {
  getAllGames: Endpoint;
  getAllGamesByTitleID: Endpoint;
  getGameByTitleID: Endpoint;
  deleteGameByTitleID: Endpoint;
}

function addTitleID(titleid: string) {
  return `/games/${titleid}`;
}

const routes: IGameRoutes = {
  getAllGames: {
    method: GET,
    path: "/games",
    url: () => "/games"
  },
  getAllGamesByTitleID: {
    method: GET,
    path: "/games/{titleid}",
    url: (titleid: string) => addTitleID(titleid)
  },
  getGameByTitleID: {
    method: GET,
    path: "/games/{titleid}/single",
    url: (titleid: string) => `${addTitleID(titleid)}/single`
  },
  deleteGameByTitleID: {
    method: DELETE,
    path: "/games/{titleid}",
    url: (titleid: string) => addTitleID(titleid)
  }
};

export abstract class GameRoutes extends Route {
  public static Endpoints = routes;
  public static QueryParams = GameQueryParams;

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
}
