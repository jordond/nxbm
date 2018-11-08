import { GameRoutes } from "@nxbm/api-endpoints";
import { Game, OnUploadProgress, UploadGamePayload } from "@nxbm/types";

import { client } from "../client";

const endpoints = GameRoutes.Endpoints;

class Games extends GameRoutes {
  public getAllGames = async () => {
    const url = this.joinUrl(endpoints.getAllGames.url());
    const result = await client.get<Game[]>(url);
    return result;
  };

  public getAllGamesByTitleID = (titleid: number) => {
    const url = this.joinUrl(endpoints.getAllGamesByTitleID.url(titleid));
    return client.get<Game[]>(url);
  };

  public getGameByTitleID = (titleid: number, revision?: string) => {
    const url = this.joinUrl(endpoints.getGameByTitleID.url(titleid));
    return client.get<Game>(url, { query: { revision } });
  };

  public postUploadGame = (
    payload: UploadGamePayload,
    onUploadProgress?: OnUploadProgress
  ) => {
    const url = this.joinUrl(endpoints.postUploadGame.url());

    const formData = new FormData();
    formData.append("destinationFolder", payload.destinationFolder);
    payload.files.forEach(file => formData.append("files", file));

    return client.post<FormData, boolean>(url, formData, {
      onUploadProgress,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
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
