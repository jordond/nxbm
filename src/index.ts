/* tslint:disable no-submodule-imports */
import "dotenv/config";

import bootstrap from "./bootstrap";
import { create } from "./logger";
import { start } from "./server";

bootstrap()
  .then(config => start(config))
  .catch(error => create().error(`Something went wrong...`, error));
