import { ServerRoute } from "hapi";

import { GET } from "../../util/hapiRoute";
import { restart, start, stop } from "./scanner.handler";

export const routes: ServerRoute[] = [
  {
    method: GET,
    path: "/scanner/start",
    handler: start
  },
  {
    method: GET,
    path: "/scanner/stop",
    handler: stop
  },
  {
    method: GET,
    path: "/scanner/restart",
    handler: restart
  }
];
