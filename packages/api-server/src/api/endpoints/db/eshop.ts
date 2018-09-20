import { EShopRoutes } from "@nxbm/api-endpoints";
import { getEShopDB } from "@nxbm/core-db";
import { internal, notFound } from "boom";
import { Lifecycle, ServerRoute } from "hapi";

export const getEShopDBHandler: Lifecycle.Method = async () => {
  const { db } = await getEShopDB();

  if (db) {
    return db;
  }

  throw internal("Unable to get the eshop database");
};

export const postRefreshDB: Lifecycle.Method = async () => {
  const eshop = await getEShopDB();
  eshop.initDb(true);
  return true;
};

export const getEShopGame: Lifecycle.Method = async ({
  params: { title, lucky },
  query
}) => {
  const eshop = await getEShopDB();
  const thresh = (query as any)[EShopRoutes.QueryParams.thresh];
  const match = lucky ? eshop.find(title) : eshop.findMany(title, thresh);

  if (match && (!Array.isArray(match) || match.length)) {
    return match;
  }

  throw notFound(`Unable to find EShop title matching ${title}`);
};

const routes = { ...EShopRoutes.Endpoints };
routes.getDatabase.handler = getEShopDBHandler;
routes.postRefreshDatabase.handler = postRefreshDB;
routes.getGameFromDB.handler = getEShopGame;

export default Object.values(routes) as ServerRoute[];
