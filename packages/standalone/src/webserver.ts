import { IConfig } from "@nxbm/types";

export function createWebServer(config: IConfig) {
  // const { host, paths, env } = config;

  return {
    listen: (vals: any, dirp: () => void) => true
  };
}
