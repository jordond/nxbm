import { getConfig, INSWDBOptions } from "../config";
import { getGameDatabase } from "./nswdb";

export { startScanner } from "./scanner";

export function getReleasesDB(options: INSWDBOptions = {}) {
  return getGameDatabase(getConfig().paths!.data, options);
}
