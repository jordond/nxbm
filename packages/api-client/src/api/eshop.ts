import { EShopRoutes } from "@nxbm/endpoints";
import { GameUS } from "@nxbm/types";

import { client } from "../client";

class EShop extends EShopRoutes {
  public getDatabase = () =>
    client.get<GameUS[]>(this.joinUrl(EShopRoutes.Endpoints.getDatabase.url()));

  public postRefreshDatabase = () =>
    client.post<never, boolean>(
      this.joinUrl(EShopRoutes.Endpoints.postRefreshDatabase.url())
    );

  public getGameFromDatabase = (title: string, lucky?: boolean) =>
    client.get<GameUS | GameUS[]>(
      this.joinUrl(EShopRoutes.Endpoints.getGameFromDB.url(title, lucky))
    );
}

export const eshop = new EShop();
