import { ScannerRoutes } from "@nxbm/endpoints";

import { client } from "../client";

const endpoints = ScannerRoutes.Endpoints;

class Scanner extends ScannerRoutes {
  public getStartScanner = () =>
    client.get<void>(this.joinUrl(endpoints.getStartScanner.url()));

  public getStopScanner = () =>
    client.get<void>(this.joinUrl(endpoints.getStopScanner.url()));

  public getRestartScanner = () =>
    client.get<void>(this.joinUrl(endpoints.getRestartScanner.url()));
}

export const scanner = new Scanner();
