import { ScannerRoutes } from "@nxbm/api-endpoints";
import { getConfig } from "@nxbm/core";
import {
  restartScanner,
  scannerIsActive,
  startScanner,
  stopScanner
} from "@nxbm/core-db";
import { badRequest, internal } from "boom";
import { Lifecycle, ServerRoute } from "hapi";

function start(): Lifecycle.ReturnValue {
  if (scannerIsActive()) {
    throw badRequest("Scanner is already started");
  }

  return tryScannerAction(startScanner(getConfig().backups), "start");
}

function stop(): Lifecycle.ReturnValue {
  if (scannerIsActive()) {
    return tryScannerAction(stopScanner(), "stop");
  }

  throw badRequest("Scanner is already stopped");
}

function restart(): Lifecycle.ReturnValue {
  return tryScannerAction(restartScanner(getConfig().backups), "restart");
}

async function tryScannerAction(promise: Promise<any>, action: string) {
  const result = await promise;
  if (!result) {
    throw internal(`Unable to ${action} the folder scanner`);
  }

  return "ok";
}

const routes = { ...ScannerRoutes.Endpoints };
routes.getStartScanner.handler = start;
routes.getStopScanner.handler = stop;
routes.getRestartScanner.handler = restart;

export default Object.values(routes) as ServerRoute[];
