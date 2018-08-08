export interface ILogConfig {
  level: string;
  path: string;
}

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  VERBOSE = "verbose",
  DEBUG = "debug",
  SILLY = "silly"
}

export const logLevels: LogLevel[] = [
  LogLevel.ERROR,
  LogLevel.WARN,
  LogLevel.INFO,
  LogLevel.VERBOSE,
  LogLevel.DEBUG,
  LogLevel.SILLY
];
