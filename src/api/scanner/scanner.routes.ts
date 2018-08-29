import { badRequest, internal } from "boom";
import { ServerRoute } from "hapi";

import { getConfig } from "../../config";
import { startScanner } from "../../files";
import {
  restartScanner,
  scannerIsActive,
  stopScanner
} from "../../files/scanner";
import { GET } from "../../util/hapiRoute";

export const routes: ServerRoute[] = [
  {
    method: GET,
    path: "/scanner/start",
    handler: () => {
      if (scannerIsActive()) {
        return badRequest("Scanner is already started");
      }

      return tryScannerAction(startScanner(getConfig().backups), "start");
    }
  },
  {
    method: GET,
    path: "/scanner/stop",
    handler: () => {
      if (scannerIsActive()) {
        return tryScannerAction(stopScanner(), "stop");
      }

      return badRequest("Scanner is already stopped");
    }
  },
  {
    method: GET,
    path: "/scanner/restart",
    handler: async () =>
      tryScannerAction(restartScanner(getConfig().backups), "restart")
  }
];

async function tryScannerAction(promise: Promise<any>, action: string) {
  const result = await promise;
  if (!result) {
    return internal(`Unable to ${action} the folder scanner`);
  }

  return "ok";
}
