import { IApiRoute } from ".";
import { flatten } from "../util/misc";
import { db } from "./db";
import config from "./endpoints/config";
import games from "./endpoints/games";
import { scanner } from "./scanner";

/**
 * Add Routes here
 */
const routes: IApiRoute[][] = [config, games, scanner, db];

export default flatten<IApiRoute>(routes).map(({ url, ...rest }: any) => rest);
