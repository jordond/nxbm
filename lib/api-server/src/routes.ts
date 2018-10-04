import { flatten } from "@nxbm/utils";

import { IApiRoute } from "./api";
import config from "./api/config";
import db from "./api/db";
import games from "./api/games";
import scanner from "./api/scanner";

/**
 * Add Routes here
 */
const routes: IApiRoute[][] = [config, games, scanner, db];

export default flatten<IApiRoute>(routes).map(({ url, ...rest }: any) => rest);
