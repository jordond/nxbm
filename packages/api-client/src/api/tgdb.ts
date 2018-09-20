import { TGDBRoutes } from "@nxbm/api-endpoints";
import { TGDBGame } from "@nxbm/types";

import { client } from "../client";

class TGDB extends TGDBRoutes {
  public getDatabase = () =>
    client.get<TGDBGame[]>(
      this.joinUrl(TGDBRoutes.Endpoints.getDatabase.url())
    );

  public postRefreshDatabase = () =>
    client.post<never, boolean>(
      this.joinUrl(TGDBRoutes.Endpoints.postRefreshDatabase.url())
    );

  public getGameFromDatabase = (title: string, lucky?: boolean) =>
    client.get<TGDBGame | TGDBGame[]>(
      this.joinUrl(TGDBRoutes.Endpoints.getGameFromDB.url(title, lucky))
    );
}

export const tgdb = new TGDB();
