import { TGDBRoutes } from "@nxbm/api-endpoints";
import { getTGDB } from "@nxbm/core-db";
import { internal, notFound } from "boom";
import { Lifecycle, ServerRoute } from "hapi";

export const getTGDBHandler: Lifecycle.Method = async () => {
  const { db } = await getTGDB();

  if (db) {
    return db;
  }

  throw internal("Unable to get the thegamesdb database");
};

export const postRefreshDB: Lifecycle.Method = async () => {
  const tgdb = await getTGDB();
  tgdb.initDb(true);
  return true;
};

export const getTGDBGame: Lifecycle.Method = async ({
  params: { title, lucky },
  query
}) => {
  const tgdb = await getTGDB();
  const thresh = (query as any)[TGDBRoutes.QueryParams.thresh];
  const match = lucky ? tgdb.find(title) : tgdb.findMany(title, thresh);

  if (match && (!Array.isArray(match) || match.length)) {
    return match;
  }

  throw notFound(`Unable to find title matching ${title}`);
};

const routes = { ...TGDBRoutes.Endpoints };
routes.getDatabase.handler = getTGDBHandler;
routes.postRefreshDatabase.handler = postRefreshDB;
routes.getGameFromDB.handler = getTGDBGame;

export default Object.values(routes) as ServerRoute[];
