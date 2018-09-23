import { IConfig } from "@nxbm/types";
import Koa from "koa";

export function createWebServer(config: IConfig) {
  // TODO - Start the webserver
  // Use the proxy for any api requests
  // https://stackoverflow.com/questions/44403320/forward-all-requests-in-in-node-js-koa-server-from-http-server-api-to-anothe
  // Serve the public files
  // Setup CORS?

  const server = new Koa();
}
