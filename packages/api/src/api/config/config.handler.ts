import { badRequest, internal } from "boom";
import { Lifecycle, Request, ResponseToolkit } from "hapi";

import { getConfig, IConfig, saveConfig, updateConfig } from "../../config";
import { create } from "../../logger";

export function getAppConfig(): Lifecycle.ReturnValue {
  try {
    const config = getConfig();
    return config;
  } catch (error) {
    return internal("Unable to get config", error);
  }
}

export async function putUpdateConfig(
  request: Request,
  r: ResponseToolkit
): Promise<Lifecycle.ReturnValue> {
  const log = create("api:config:update");

  const payload = request.payload as Partial<IConfig>;
  let updated: IConfig;
  try {
    updated = updateConfig(payload);
  } catch (error) {
    log.error("Failed to update config");
    log.error(error);
    return badRequest("Config was invalid", error);
  }

  const saved = await saveConfig(updated);
  if (saved) {
    return updated;
  }

  return internal("Unable to save the config to the disk");
}
