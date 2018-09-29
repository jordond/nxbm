import { createLogger } from "@nxbm/core";
import { GET, IConfig } from "@nxbm/types";
import { Server } from "hapi";
import * as inert from "inert";
import { join, resolve } from "path";

export async function setupWebserver(server: Server, { env }: IConfig) {
  await server.register(
    inert as any /* TODO - Temp fix until plugin issue resolved */
  );

  const contextDir = env === "development" ? "./dist" : __dirname;
  const webDir = resolve(contextDir, "public");
  const indexFile = join(webDir, "index.html");

  const log = createLogger("nxbm:server");
  log.debug(`Web Directory: ${webDir}`);

  server.route({
    method: GET,
    path: "/{file*}",
    handler: {
      directory: {
        path: webDir,
        redirectToSlash: true,
        index: true
      }
    }
  });

  server.route({
    method: GET,
    path: "/",
    handler: (_, h) => (h as any).file(indexFile)
  });
}
