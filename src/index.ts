import bootstrap from "./bootstrap";
import { create } from "./logger";
import { start } from "./server";

bootstrap()
  .then(config => start(config))
  .catch(error => {
    const log = create();
    log.error("Something went really wrong! App is exiting.");
    log.error(error);
  });
