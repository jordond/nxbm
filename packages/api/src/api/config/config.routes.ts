import { ServerRoute } from "hapi";

import { GET, PUT } from "../../util/hapiRoute";
import { getAppConfig, putUpdateConfig } from "./config.handler";

export const routes: ServerRoute[] = [
  {
    method: GET,
    path: "/config",
    handler: getAppConfig
  },
  {
    method: PUT,
    path: "/config",
    handler: putUpdateConfig
  }
];
