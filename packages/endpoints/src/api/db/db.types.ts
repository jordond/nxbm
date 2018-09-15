import { Endpoint, Route } from "../../route";
import { GET, POST } from "../../util/hapi";

export enum DBQueryParams {
  thresh = "thresh"
}

export interface IDBRoutes {
  getDatabase: Endpoint;
  postRefreshDatabase: Endpoint;
  getGameFromDB: Endpoint;
}

export function generateRoutes(type: string): IDBRoutes {
  const path = `/db/${type}`;
  return {
    getDatabase: {
      path,
      method: GET,
      url: () => path
    },
    postRefreshDatabase: {
      path,
      method: POST,
      url: () => path
    },
    getGameFromDB: {
      method: GET,
      path: `${path}/{title}/{lucky?}`,
      url: (title: string, lucky?: boolean) =>
        `${path}/${title}${lucky ? "/lucky" : ""}`
    }
  };
}
