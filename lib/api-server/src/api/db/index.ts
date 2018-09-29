import { flatten } from "@nxbm/utils";
import { ServerRoute } from "hapi";

import eshop from "./eshop";
import tgdb from "./tgdb";

export default flatten([tgdb, eshop]) as ServerRoute[];
