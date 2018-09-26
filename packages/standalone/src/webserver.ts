import { GET, IConfig } from "@nxbm/types";
import { Server } from "hapi";
import * as inert from "inert";
import { join, resolve } from "path";

export async function setupWebserver(server: Server, { env }: IConfig) {
  await server.register(inert);

  const webDir = resolve(__dirname, "public");
  const indexFile = join(webDir, "index.html");

  server.route({
    method: "GET",
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
    handler: (_, h) => h.file(indexFile)
  });
}
