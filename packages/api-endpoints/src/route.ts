import { Lifecycle, ServerRoute } from "hapi";
import * as urljoin from "url-join";

export const API_ROOT = "/api";

export interface Endpoint extends ServerRoute {
  url: (...path: any[]) => string;
  handler?: Lifecycle.Method;
}

export abstract class Route {
  public static ApiBase = "";
  protected joinUrl = (...paths: any[]): string =>
    (urljoin as any)(Route.ApiBase, API_ROOT, ...paths);
}
