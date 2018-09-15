import { TGDBGame } from "@nxbm/types";

import { Route } from "../../route";
import { DBQueryParams, generateRoutes } from "./db.types";

const routes = generateRoutes("tgdb");

export abstract class TGDBRoutes extends Route {
  public static Endpoints = routes;
  public static QueryParams = DBQueryParams;

  public abstract getDatabase: () => Promise<TGDBGame[]>;
  public abstract getRefreshDatabase: () => Promise<boolean>;
  public abstract getGameFromDatabase: (
    title: string,
    lucky: boolean
  ) => Promise<TGDBGame>;
}
