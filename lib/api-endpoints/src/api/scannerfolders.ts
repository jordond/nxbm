import { DELETE, GET, POST, PUT, ScannerFolder } from "@nxbm/types";

import { Endpoint, Route } from "../route";

enum GameQueryParams {
  hardDelete = "hardDelete"
}

interface IFolderRoutes {
  getFolders: Endpoint;
  postAddFolder: Endpoint;
  putUpdateFolder: Endpoint;
  deleteFolder: Endpoint;
}

const ROOT = "/folders";

const routes: IFolderRoutes = {
  getFolders: {
    method: GET,
    path: ROOT,
    url: () => ROOT
  },
  postAddFolder: {
    method: POST,
    path: ROOT,
    url: () => ROOT
  },
  putUpdateFolder: {
    method: PUT,
    path: ROOT,
    url: () => ROOT
  },
  deleteFolder: {
    method: DELETE,
    path: `${ROOT}/{id}`,
    url: (id: string) => `${ROOT}/${id}`
  }
};

export abstract class ScannerFolderRoutes extends Route {
  public static Endpoints = routes;
  public static QueryParams = GameQueryParams;

  public abstract getFolders: () => Promise<ScannerFolder[]>;
  public abstract postAddFolder: (
    payload: Partial<ScannerFolder>
  ) => Promise<ScannerFolder>;
  public abstract putUpdateFolder: (
    payload: ScannerFolder
  ) => Promise<ScannerFolder>;
  public abstract deleteFolder: (folderId: string) => Promise<boolean>;
}
