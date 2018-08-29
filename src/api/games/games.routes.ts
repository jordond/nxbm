import { ServerRoute } from "hapi";

import { getGameDB } from "../../files/games/db";
import { Methods } from "../../util/hapiRoute";

// TODO - Appears sceneLanguages is broken!
const routes: ServerRoute[] = [
  {
    method: Methods.GET,
    path: "/games",
    handler: async (_, r) => {
      const db = await getGameDB();
      return { xcis: db.xcis };
    }
  }
];

export default routes;
