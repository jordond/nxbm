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

export const getEShopGame: Lifecycle.Method = async request => {
  const eshop = await getEShopDB();
  const title = request.params.title;
  const match = eshop
    .getData()
    .find(item => new RegExp(title, "gi").test(item.title));

  if (match) {
    return match;
  }

  return notFound(`Unable to find title matching ${title}`);
};
