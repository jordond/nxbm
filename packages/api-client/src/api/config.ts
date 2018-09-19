import { ConfigRoutes } from "@nxbm/endpoints";
import { IConfig } from "@nxbm/types";

import { client } from "../client";

const endpoints = ConfigRoutes.Endpoints;

class Config extends ConfigRoutes {
  public getAppConfig = () =>
    client.get<IConfig>(this.joinUrl(endpoints.getAppConfig.url()));

  public putUpdateConfig = (newConfig: Partial<IConfig>) =>
    client.put<IConfig, IConfig>(
      this.joinUrl(endpoints.putUpdateConfig.url(), newConfig)
    );
}

export const config = new Config();
