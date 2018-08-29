import { Lifecycle, Request, ResponseToolkit, ServerRoute } from "hapi";
import { normalize } from "path";

import { GameDB } from "../files/games/game";
import games from "./games";
import scanner from "./scanner";

export interface IApiRoute extends ServerRoute {
  prefix?: string;
}

export type DBRouteHandler = (
  params: {
    request: Request;
    r: ResponseToolkit;
    db: GameDB;
  }
) => Lifecycle.ReturnValue;

// Redirect to the api for now
const rootRoutes: ServerRoute[] = [
  {
    method: ["POST", "GET", "PUT", "PATCH", "DELETE"],
    path: "/",
    handler: (_, r) => r.redirect("/api")
  },
  {
    method: "GET",
    path: "/api",
    handler: (_, r) => r.response("nxbm API")
  }
];

/**
 * Add Routes here
 */
const routes: IApiRoute[] = [...games(), ...scanner()];

const apiRoutes: ServerRoute[] = routes.map(
  ({ prefix = "/api/", ...route }: IApiRoute) => {
    const path = normalize(`${prefix || ""}${route.path}`);
    const serverRoute: ServerRoute = {
      ...route,
      path
    };

    return serverRoute;
  }
);

export default [...rootRoutes, ...apiRoutes];
