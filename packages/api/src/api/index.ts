import { Lifecycle, Request, ResponseToolkit, ServerRoute } from "hapi";
import { join } from "path";

import { GameDB } from "../files/games/gamedb";
import { API_ROOT } from "./route";
import routes from "./routes";

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
    handler: (_, r) => r.redirect(API_ROOT)
  },
  {
    method: "GET",
    path: API_ROOT,
    handler: (_, r) => r.response("nxbm API")
  }
];

const apiRoutes: ServerRoute[] = routes.map(
  ({ prefix = API_ROOT, ...route }: IApiRoute) => {
    const path = join(prefix || "", route.path);
    const serverRoute: ServerRoute = {
      ...route,
      path
    };

    return serverRoute;
  }
);

export default [...rootRoutes, ...apiRoutes];
