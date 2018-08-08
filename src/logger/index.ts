import { Logger, LoggerInstance, LoggerOptions, transports } from "winston";

import { getConfig } from "../config/config";
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
  { level, path }: ILogConfig = getConfig().logger
): LoggerInstance {
  const logLevel = validateLevelOrDefault(level);
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
        filename: path,
        maxSize: 50 * 1024,
        maxFiles: 5,
        json: true
      })
    ]
  };

  return new Logger(loggerOptions);
}
