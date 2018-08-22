import { getConfig, INSWDBOptions } from "../config";
import { getGameDatabase } from "./nswdb";

export { ensureHactool } from "./hactool/tools";
export { startScanner } from "./scanner";
export * from "./keys";

export function getReleasesDB(options: INSWDBOptions = {}) {
  return getGameDatabase(getConfig().paths!.data, options);
}
