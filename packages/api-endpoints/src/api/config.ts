import { IConfig } from "@nxbm/types";
import { GET, PUT } from "@nxbm/utils/dist/hapiRoute";

import { Endpoint, Route } from "../route";

interface IConfigRoutes {
  getAppConfig: Endpoint;
  putUpdateConfig: Endpoint;
}

const ROOT = "/config";

export const routes: IConfigRoutes = {
  getAppConfig: {
    method: GET,
    path: "/config",
    url: () => ROOT
  },
  putUpdateConfig: {
    method: PUT,
    path: "/config",
    url: () => ROOT
  }
};

export abstract class ConfigRoutes extends Route {
  public static Endpoints = routes;

  public abstract getAppConfig: () => Promise<IConfig>;
  public abstract putUpdateConfig: (
    config: Partial<IConfig>
  ) => Promise<IConfig>;
}
