import { ServerRoute } from "hapi";
import { normalize } from "path";

import games from "./games/games.routes";

export interface IApiRoute extends ServerRoute {
  prefix?: string;
}

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
const routes: IApiRoute[] = [...games];

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
