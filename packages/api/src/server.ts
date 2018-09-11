import { Server } from "hapi";
import goodWinston from "hapi-good-winston";

import routes from "./api";
import { IConfig } from "./config";
import { create } from "./logger";

const log = create("API");

export async function start(config: IConfig) {
  const { port, host } = config;
  const server = new Server({ port, host, routes: { cors: true } });

  const goodWinstonOptions = {
    levels: {
      ops: "silly",
      response: "verbose",
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

  try {
    log.verbose(`Starting API server on -> ${host}:${port}`);

    await server.start();
    log.info(`Server running on ${config.host}:${config.port}`);
  } catch (error) {
    log.error("Unable to start server...\n");
    throw error;
  }
}
