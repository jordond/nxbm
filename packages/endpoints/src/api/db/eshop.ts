import { GameUS } from "@nxbm/types";

import { Route } from "../../route";
import { DBQueryParams, generateRoutes } from "./db.types";

const routes = generateRoutes("eshop");

export abstract class EShopRoutes extends Route {
  public static Endpoints = routes;
  public static QueryParams = DBQueryParams;

  public abstract getDatabase: () => Promise<GameUS[]>;
  public abstract postRefreshDatabase: () => Promise<boolean>;
  public abstract getGameFromDatabase: (
    title: string,
    lucky?: boolean
  ) => Promise<GameUS | GameUS[]>;
}
