import { IApiRoute } from ".";
import { flatten } from "../util/misc";
import { config } from "./config";
import { db } from "./db";
import { games } from "./games";
import { scanner } from "./scanner";

/**
 * Add Routes here
 */
const routes: IApiRoute[][] = [config, games, scanner, db];

export default flatten<IApiRoute>(routes);
