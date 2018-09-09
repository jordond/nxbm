import { internal, notFound } from "boom";
import { Lifecycle } from "hapi";

import { getEShopDB } from "../../../files/eshopdb";

export const getEShopDBHandler: Lifecycle.Method = async () => {
  const { db } = await getEShopDB();

  if (db) {
    return db;
  }

  return internal("Unable to get the eshop database");
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
  const thresh = (query as any).thresh;
  const match = lucky ? eshop.find(title) : eshop.findMany(title, thresh);

  if (match) {
    return match;
  }

  return notFound(`Unable to find title matching ${title}`);
};
