import { createLogger } from "@nxbm/core";
import { GET } from "@nxbm/types";
import { pathExists } from "fs-extra";
import { Server } from "hapi";
import * as inert from "inert";
import { join, resolve } from "path";

function checkWebFilesExist(path: string) {
  const log = createLogger("nxbm:server");
  try {
    log.debug(`Checking if ${path} exists`);
    return pathExists(path);
  } catch (error) {
    log.error(`Unable stat index.html!\n${error}`);
    return false;
  }
}

export async function setupWebserver(server: Server) {
  await server.register(
    inert as any /* TODO - Temp fix until plugin issue resolved */
  );

  const webDir = resolve(__dirname, "public");
  const indexFile = join(webDir, "index.html");

  const log = createLogger("nxbm:server");
  log.debug(`Web Directory: ${webDir}`);
  if (!(await checkWebFilesExist(indexFile))) {
    throw new Error(`Unable to locate web files: ${indexFile}`);
  }

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
