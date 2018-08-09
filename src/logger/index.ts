import { resolve } from "path";
import { Logger, LoggerInstance, LoggerOptions, transports } from "winston";

import { getConfig, IConfig } from "../config";
import { ILogConfig, LogLevel } from "./ILogger";

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

export function create(
  label: string = "App",
  config: IConfig = getConfig()
): LoggerInstance {
  const logLevel = validateLevelOrDefault(config.logger!.level);
  const common: object = { level: logLevel, timestamp: true };
  const loggerOptions: LoggerOptions = {
    label,
    transports: [
      new Console({
        ...common,
        prettyPrint: true,
        colorize: true,
        json: false
      }),
      new File({
        ...common,
        filename: resolve(config.paths!.data, FILENAME),
        maxSize: 50 * 1024,
        maxFiles: 5,
        json: true
      })
    ]
  };

  return new Logger(loggerOptions);
}
