import { initBackend } from "@nxbm/api-backend";
import { createServer } from "@nxbm/api-server";
import { createLogger, getConfig } from "@nxbm/core";
import { IConfig } from "@nxbm/types";
import { tempDir } from "@nxbm/utils";
import { emptyDir } from "fs-extra";
import { Server } from "hapi";

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
    await setupWebserver(server, config);
    startWebserver(server, config);
  } catch (error) {
    return fatalExit(error);
  }
}

async function startWebserver(server: Server, { host, port }: IConfig) {
  const log = createLogger("nxbm:webserver");
  log.info("Starting webserver");

  try {
    await server.start();
    log.info(`Started NXBM at http://${host}:${port}`);
    log.info("nxbm is fully loaded and ready to go!");
  } catch (error) {
    log.error("Failed to start the webserver!");
    fatalExit(error);
  }
}
