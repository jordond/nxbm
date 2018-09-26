import { GET } from "@nxbm/utils/dist/hapiRoute";

import { Endpoint, Route } from "../route";

interface IScannerRoutes {
  getStartScanner: Endpoint;
  getStopScanner: Endpoint;
  getRestartScanner: Endpoint;
}

const routes: IScannerRoutes = {
  getStartScanner: {
    method: GET,
    path: "/scanner/start",
    url: () => "/scanner/start"
  },
  getStopScanner: {
    method: GET,
    path: "/scanner/stop",
    url: () => "/scanner/stop"
  },
  getRestartScanner: {
    method: GET,
    path: "/scanner/restart",
    url: () => "/scanner/restart"
  }
};

export abstract class ScannerRoutes extends Route {
  public static Endpoints = routes;

  public abstract getStartScanner: () => Promise<void>;
  public abstract getStopScanner: () => Promise<void>;
  public abstract getRestartScanner: () => Promise<void>;
}
