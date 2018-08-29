import {
  Lifecycle,
  Request,
  ResponseToolkit,
  RouteOptionsPreAllOptions,
  ServerRoute
} from "hapi";

import { noop } from "./misc";

export function applyPreRequest(
  pre: RouteOptionsPreAllOptions[],
  routes: ServerRoute[],
  modifyHandler: (
    request: Request,
    r: ResponseToolkit,
    handler: Lifecycle.Method
  ) => void = noop
): ServerRoute[] {
  return routes.map(route => ({
    ...route,
    options: {
      ...route.options,
      pre
    },
    handler: (request: Request, r: ResponseToolkit) => {
      return modifyHandler(request, r, route.handler as Lifecycle.Method);
    }
  }));
}

export enum Methods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE"
}
