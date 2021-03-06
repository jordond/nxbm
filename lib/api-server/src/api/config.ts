import { ConfigRoutes } from "@nxbm/api-endpoints";
import { createLogger, getConfig, saveConfig, updateConfig } from "@nxbm/core";
import { IConfig } from "@nxbm/types";
import { badRequest, internal } from "boom";
import { Lifecycle, Request, ServerRoute } from "hapi";

function getAppConfig(): Lifecycle.ReturnValue {
  try {
    const config = getConfig();
    return config;
  } catch (error) {
    throw internal("Unable to get config", error);
  }
}

async function putUpdateConfig(
  request: Request
): Promise<Lifecycle.ReturnValue> {
  const log = createLogger("api:config:update");

  const payload = request.payload as Partial<IConfig>;
  let updated: IConfig;
  try {
    updated = updateConfig(payload);
  } catch (error) {
    log.error("Failed to update config");
    log.error(error);
    throw badRequest("Config was invalid", error);
  }

  const saved = await saveConfig(updated);
  if (!saved) {
    throw internal("Unable to save the config to the disk");
  }

  return updated;
}

const routes = { ...ConfigRoutes.Endpoints };
routes.getAppConfig.handler = getAppConfig;
routes.putUpdateConfig.handler = putUpdateConfig;

export default Object.values(routes) as ServerRoute[];
