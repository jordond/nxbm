import { Lifecycle } from "hapi";

export const getEShopDBHandler: Lifecycle.Method = (request, r) => {
  return {};
};

export const postRefreshDB: Lifecycle.Method = () => true;

export const getEShopGame: Lifecycle.Method = () => ({});
