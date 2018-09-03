import { ServerRoute } from "hapi";

import { GET, POST } from "../../../util/hapiRoute";
import {
  getEShopDBHandler,
  getEShopGame,
  postRefreshDB
} from "./eshop.handler";

export const routes: ServerRoute[] = [
  {
    method: GET,
    path: "/db/eshop",
    handler: getEShopDBHandler
  },
  {
    method: POST,
    path: "/db/eshop",
    handler: postRefreshDB
  },
  {
    method: GET,
    path: "/db/eshop/{game}",
    handler: getEShopGame
  }
];
