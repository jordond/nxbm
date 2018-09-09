import { internal, notFound } from "boom";
import { Lifecycle } from "hapi";

import { getTGDB } from "../../../files/thegamesdb";

export const getTGDBHandler: Lifecycle.Method = async () => {
  const { db } = await getTGDB();

  if (db) {
    return db;
  }

  return internal("Unable to get the thegamesdb database");
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
  const thresh = (query as any).thresh;
  const match = lucky ? tgdb.find(title) : tgdb.findMany(title, thresh);

  if (match) {
    return match;
  }

  return notFound(`Unable to find title matching ${title}`);
};
