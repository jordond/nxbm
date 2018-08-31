import {
  Request,
  ResponseToolkit,
  RouteOptionsPreAllOptions,
  ServerRoute
} from "hapi";

import { noop } from "./misc";

export function applyPreRequest<T>(
  pre: RouteOptionsPreAllOptions[],
  routes: ServerRoute[],
  modifyHandler: (
    request: Request,
    r: ResponseToolkit,
    handler: T
  ) => void = noop
): ServerRoute[] {
  return routes.map(route => ({
    ...route,
    options: {
      ...route.options,
      pre
    },
    handler: (request: Request, r: ResponseToolkit) => {
      return modifyHandler(request, r, route.handler as T);
    }
  }));
}

export const GET = "GET";
export const POST = "POST";
export const PUT = "PUT";
export const PATCH = "PATCH";
export const DELETE = "DELETE";

// tslint:disable-next-line:variable-name
export const Methods = {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE
};

export const OK = 200;
export const CREATED = 201;
export const ACCEPTED = 202;
