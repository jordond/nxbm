import { IConfig } from "@nxbm/types";
import Koa from "koa";
import proxy from "koa-proxy";
import serve from "koa-static";
import { resolve } from "path";

export function createWebServer(config: IConfig) {
  // TODO - Start the webserver
  // Use the proxy for any api requests
  // https://stackoverflow.com/questions/44403320/forward-all-requests-in-in-node-js-koa-server-from-http-server-api-to-anothe
  // Serve the public files
  // Setup CORS?

  const { host, paths } = config;
  const server = new Koa();

  server.use(
    proxy({
      host,
      match: /^\/api\//
    })
  );

  const webDir = resolve(__dirname, "public");
  server.use(serve(webDir));

  const mediaDir = resolve(paths!.data);
  server.use(serve(mediaDir));

  const port = config.port! + 1;
  server.listen({
    host,
    port
  });
}
