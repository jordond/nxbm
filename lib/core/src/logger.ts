import { IConfig, LogLevel } from "@nxbm/types";
import { resolve } from "path";
import { Logger, LoggerInstance, LoggerOptions, transports } from "winston";

import { getConfig, getDataDir } from "./config";

const { Console, File } = transports;

export const FILENAME = "nxbm.log";

export function validateLevelOrDefault(level: string) {
  const levels = Object.values(LogLevel).map((x: string) =>
    x
      .toLowerCase()
      .trim()
      .replace(/ /g, "")
  );
  if (levels.find((x: string) => x === level.toLowerCase())) {
    return level.toLowerCase();
  }

  return LogLevel.INFO;
}

export function createLogger(
  label: string = "App",
  config: IConfig = getConfig()
): LoggerInstance {
  const logLevel = validateLevelOrDefault(config.logger!.level);
  const common: object = { label, level: logLevel, timestamp: true };
  const loggerOptions: LoggerOptions = {
    transports: [
      new Console({
        ...common,
        prettyPrint: true,
        colorize: true,
        json: false
      }),
      new File({
        ...common,
        filename: resolve(getDataDir(), FILENAME),
        maxSize: 50 * 1024,
        maxFiles: 5,
        json: true
      })
    ]
  };

  return new Logger(loggerOptions);
}
