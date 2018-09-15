import { IApiRoute } from ".";
import { flatten } from "../util/misc";
import config from "./endpoints/config";
import db from "./endpoints/db";
import games from "./endpoints/games";
import scanner from "./endpoints/scanner";

/**
 * Add Routes here
 */
const routes: IApiRoute[][] = [config, games, scanner, db];

export default flatten<IApiRoute>(routes).map(({ url, ...rest }: any) => rest);
