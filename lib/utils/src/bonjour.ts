import * as bonjourLib from "bonjour";

import { IConfig } from "@nxbm/types";

const bonjour = bonjourLib();

export const TYPE_NXBM = "nxbm";

export function broadcastService({ host, port }: IConfig) {
  bonjour.publish({
    host,
    port: port!,
    name: "NXBM - Nintendo Switch Backup Manager",
    type: TYPE_NXBM
  });
}

export function findService(timeoutDelay: number = 15 * 1000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject("Could not find service"),
      timeoutDelay
    );

    bonjour.find({ type: TYPE_NXBM }, service => {
      clearTimeout(timeout);
      resolve(service);
    });
  });
}
