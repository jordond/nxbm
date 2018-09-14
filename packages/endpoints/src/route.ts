import { Lifecycle, ServerRoute } from "hapi";
import urljoin from "url-join";

export const API_ROOT = "/api";

export interface Endpoint extends ServerRoute {
  url: (...path: any[]) => string;
  handler?: Lifecycle.Method;
}

export abstract class Route {
  protected joinUrl = (...paths: any[]) =>
    urljoin(API_ROOT, ...paths);
}
