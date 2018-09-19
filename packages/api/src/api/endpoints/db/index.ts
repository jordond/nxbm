import { ServerRoute } from "hapi";

import { flatten } from "../../../util/misc";
import eshop from "./eshop";
import tgdb from "./tgdb";

export default flatten([tgdb, eshop]) as ServerRoute[];
