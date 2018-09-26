import { API_ROOT } from "@nxbm/api-endpoints";
import { ServerRoute } from "hapi";
import { join } from "path";

import routes from "../routes";

export interface IApiRoute extends ServerRoute {
  prefix?: string;
}

// Redirect to the api for now
const rootRoutes: ServerRoute[] = [
  {
    method: "*",
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
