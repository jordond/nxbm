import { getConfig, INSWDBOptions } from "../config";
import { getNSWDB } from "./nswdb";

export { ensureHactool } from "./hactool/tools";
export { startScanner } from "./scanner";
export * from "./keys";

export function getReleasesDB(options: INSWDBOptions = {}) {
  return getNSWDB(getConfig().paths!.data, options);
}
