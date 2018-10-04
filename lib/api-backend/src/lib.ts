import { IConfig } from "@nxbm/types";

import { bootstrap } from "./bootstrap";

export async function initBackend(config: IConfig) {
  try {
    await bootstrap(config);
  } catch (error) {
    throw error;
  }
}
