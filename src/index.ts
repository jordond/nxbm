import bootstrap from "./bootstrap";
import { create } from "./logger";
import { start } from "./server";

bootstrap()
  .then(config => start(config))
  .catch(error => {
    const log = create();
    log.error("Due to the following error, the app is exiting.");
    log.error(error, () => setTimeout(() => process.exit(1), 2000));
  });
