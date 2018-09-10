import { ServerRoute } from "hapi";

import { GET, POST } from "../../../util/hapiRoute";
import { getTGDBGame, getTGDBHandler, postRefreshDB } from "./tgdb.handler";

export const routes: ServerRoute[] = [
  {
    method: GET,
    path: "/db/tgdb",
    handler: getTGDBHandler
  },
  {
    method: POST,
    path: "/db/tgdb",
    handler: postRefreshDB
  },
  {
    method: GET,
    path: "/db/tgdb/{title}/{lucky?}",
    handler: getTGDBGame
  }
];
