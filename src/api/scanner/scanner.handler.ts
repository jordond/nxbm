import { badRequest, internal } from "boom";

import { getConfig } from "../../config";
import {
  restartScanner,
  scannerIsActive,
  startScanner,
  stopScanner
} from "../../files/scanner";

export function start() {
  if (scannerIsActive()) {
    return badRequest("Scanner is already started");
  }

  return tryScannerAction(startScanner(getConfig().backups), "start");
}

export function stop() {
  if (scannerIsActive()) {
    return tryScannerAction(stopScanner(), "stop");
  }

  return badRequest("Scanner is already stopped");
}

export function restart() {
  return tryScannerAction(restartScanner(getConfig().backups), "restart");
}

async function tryScannerAction(promise: Promise<any>, action: string) {
  const result = await promise;
  if (!result) {
    return internal(`Unable to ${action} the folder scanner`);
  }

  return "ok";
}
