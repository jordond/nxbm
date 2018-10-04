import { initBackend } from "@nxbm/api-backend";
import { createServer, startServer } from "@nxbm/api-server";
import { createLogger, getConfig, isProduction } from "@nxbm/core";
import { tempDir } from "@nxbm/utils";
import { emptyDir } from "fs-extra";

import { setupWebserver } from "./webserver";

async function fatalExit(error: any) {
  const log = createLogger();
  log.error("Due to the following error, the app is exiting.");
  log.error(error, () =>
    setTimeout(async () => {
      await emptyDir(tempDir());
      process.exit(1);
    }, 2000)
  );
}

export async function start() {
  const config = getConfig();

  const log = createLogger("nxbm");

  log.info("Starting backend services");
  try {
    await initBackend(config);

    const server = await createServer(config);

    if (isProduction()) {
      await setupWebserver(server);
    } else {
      log.info("Not starting webserver in dev mode");
    }

    startServer(server);
  } catch (error) {
    return fatalExit(error);
  }
}
