import { init } from "@nxbm/api-backend";
import { createLogger, getConfig } from "@nxbm/core";

import { startWebServer } from "./webserver";

export async function start() {
  const config = await getConfig();

  const log = createLogger("nxbm");

  log.info("Starting backend services");
  await init();

  log.info("Starting webserver");
  await startWebServer(config);

  log.info("nxbm is fully loaded and ready to go!");
}
