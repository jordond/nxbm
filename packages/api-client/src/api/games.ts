import { GameRoutes } from "@nxbm/api-endpoints";
import { Game } from "@nxbm/types";

import { client } from "../client";

const endpoints = GameRoutes.Endpoints;

class Games extends GameRoutes {
  public getAllGames = async () => {
    const url = this.joinUrl(endpoints.getAllGames.url());
    const xcis = await client.get<Game[]>(url);
    return { xcis };
  };

  public getAllGamesByTitleID = (titleid: number) => {
    const url = this.joinUrl(endpoints.getAllGamesByTitleID.url(titleid));
    return client.get<Game[]>(url);
  };

  public getGameByTitleID = (titleid: number, revision?: string) => {
    const url = this.joinUrl(endpoints.getGameByTitleID.url(titleid));
    return client.get<Game>(url, { query: { revision } });
  };

  public deleteGameByTitleID = (
    titleid: number,
    revision?: string,
    hardDelete?: boolean
  ) => {
    const url = this.joinUrl(endpoints.deleteGameByTitleID.url(titleid));
    return client.delete<void>(url, { query: { revision, hardDelete } });
  };
}

export const games = new Games();
