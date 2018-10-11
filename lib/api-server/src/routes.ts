import { flatten } from "@nxbm/utils";

import { IApiRoute } from ".";
import config from "./api/config";
import db from "./api/db";
import games from "./api/games";
import scanner from "./api/scanner";
import scannerfolders from "./api/scannerfolders";

/**
 * Add Routes here
 */
const routes: IApiRoute[][] = [config, games, scanner, db, scannerfolders];

export default flatten<IApiRoute>(routes).map(({ url, ...rest }: any) => rest);
