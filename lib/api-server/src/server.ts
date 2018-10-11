import { createLogger } from "@nxbm/core";
import { IConfig } from "@nxbm/types";
import { Server } from "hapi";
import goodWinston from "hapi-good-winston";

import routes from "./";

const log = createLogger("nxbm:API");

export async function createServer(config: IConfig) {
  const { port, host } = config;
  const server = new Server({ port, host, routes: { cors: true } });

  const goodWinstonOptions = {
    levels: {
      ops: "silly",
      response: "debug",
      request: "debug",
      error: "error"
    }
  };

  const options = {
    reporters: {
      winston: [goodWinston(log, goodWinstonOptions)]
    }
  };

  await server.register({ options, plugin: require("good") });

  log.info(`Adding ${routes.length} routes`);
  routes.forEach(({ method, path }) =>
    log.debug(`Adding -> ${method} - ${path}`)
  );
  server.route(routes);

  return server;
}

export async function startServer(server: Server) {
  try {
    log.verbose(`Starting API server on -> ${server.info.uri}`);

    await server.start();
    log.info(`Server running on ${server.info.uri}`);
  } catch (error) {
    log.error("Unable to start server...\n");
    throw error;
  }
}
