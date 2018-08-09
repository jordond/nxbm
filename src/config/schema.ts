import { Schema } from "convict";
import { join, resolve } from "path";
import { FILENAME } from "../logger";
import { ILogConfig, LogLevel } from "../logger/ILogger";

const root = resolve(__dirname, "../");
const data = join(root, "data");

export interface IConfig {
  env?: string;
  host?: string;
  port?: number;
  paths?: IPaths;
  logger?: ILogConfig;
  backups: IBackupConfig;
}

export interface IPaths {
  root: string;
  data: string;
}

export interface IBackupConfig {
  folders: string[];
  watch: boolean;
  recursive: boolean;
}

export const schema: Schema<any> = {
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "development",
    env: "NODE_ENV",
    arg: "env"
  },
  host: {
    doc: "The IP address to bind.",
    format: "ipaddress",
    default: "0.0.0.0",
    env: "HOST",
    arg: "host"
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 9999,
    env: "PORT",
    arg: "port"
  },
  paths: {
    root: {
      doc: "Root directory for application",
      format: String,
      default: root,
      env: "ROOT_DIR",
      arg: "root"
    },
    data: {
      doc: "Data directory for application",
      format: String,
      default: data,
      env: "DATA_DIR",
      arg: "data"
    }
  },
  logger: {
    level: {
      doc: "Log level to use",
      default: LogLevel.INFO,
      env: "LOG_LEVEL",
      arg: "level",
      format: (val: string) => {
        const levels = Object.values(LogLevel).map((x: string) =>
          x.toLowerCase()
        );
        const found = levels.find((x: string) => x === val.toLowerCase());
        if (!found) {
          throw new Error(
            `Invalid log level -> ${val.toLowerCase()}\n Accepted values: ${levels}`
          );
        }
      }
    }
  },
  backups: {
    folders: {
      doc: "Folders to watch for XCI and NSP files",
      format: Array,
      default: []
    },
    watch: {
      doc: "Watch folders for changes",
      format: Boolean,
      default: true,
      arg: "watch"
    },
    recursive: {
      doc: "Scan folders recursively",
      format: Boolean,
      default: true,
      arg: "recursive"
    }
  }
};
