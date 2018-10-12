import { Schema } from "convict";
import isUrl from "is-url";
import { resolve } from "path";

import { LogLevel } from "./logger";

const root = resolve(__dirname);

export const ENV_PROD = "production";
export const ENV_DEV = "development";
export const ENV_TEST = "test";
export const ENVIRONMENTS = [ENV_PROD, ENV_DEV, ENV_TEST];

export const MAX_CONCURRENCY = 25;

export const schema: Schema<any> = {
  env: {
    doc: "The application environment.",
    format: ENVIRONMENTS,
    default: ENV_PROD,
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
      default: "",
      env: "DATA_DIR",
      arg: "data"
    },
    keys: {
      doc: "Path to the `keys` file to use with hactool",
      format: String,
      default: "",
      env: "KEY_FILE",
      arg: "keys"
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
      format: (val: any[]) => {
        val.forEach(({ id, path }) => {
          if (!id || !path) {
            throw new Error(
              "Scanner folder is not correct, must have an ID and path property"
            );
          }
        });
      },
      default: []
    },
    watch: {
      doc: "Watch folders for changes",
      format: Boolean,
      default: true,
      arg: "watch"
    },
    recursive: {
      doc: "Enable/disable recursive scanning for ALL folders",
      format: Boolean,
      default: true,
      arg: "recursive"
    },
    concurrency: {
      doc: "Max number of files to process at a time",
      format: "nat",
      default: 5,
      arg: "concurrency"
    },
    nswdb: {
      force: {
        doc: "Force the downloading of a fresh NSWDB",
        format: Boolean,
        default: false,
        env: "NSWDB_FORCE",
        arg: "nswdbForce"
      },
      refreshInterval: {
        doc: "Refresh NSWDB after interval (in hours)",
        format: Number,
        default: 24,
        arg: "nswdbInterval"
      }
    },
    tgdb: {
      refreshInterval: {
        doc: "Hours to refresh thegamesdb database",
        format: Number,
        default: 24 * 7
      },
      apikey: {
        doc:
          "Api key for using thegamesdb.net, if not supplied a default one will be used.  But may be rate limited as there is a monthly limit",
        format: String,
        default: ""
      }
    },
    eshop: {
      refreshInterval: {
        doc: "Hours to refresh the eshop database",
        format: Number,
        default: 24 * 1
      }
    },
    autoInstallHactool: {
      doc:
        "If hactool is missing, automatically download and compile (if needed)",
      format: Boolean,
      default: true,
      arg: "autoHactool"
    },
    downloadKeysUrl: {
      doc: "Automatically download the Switch key files from this URL",
      format: (val: string) => {
        if (val && !isUrl(val)) {
          throw new Error("Needs to be a URL!");
        }
      },
      default: "",
      arg: "downloadKeysUrl"
    },
    xci: {
      doc:
        "Parsing XCI files requires python2 and a Switch keys file, use this to disable it if you don't want to use XCI files",
      format: Boolean,
      default: true,
      arg: "xci"
    },
    removeBlacklisted: {
      doc: "Remove blacklisted files found in the db",
      format: Boolean,
      default: false
    },
    getDetailedInfo: {
      doc: "Gather extra information from the eshop and thegamesdb",
      format: Boolean,
      default: true
    },
    downloadGameMedia: {
      doc: "Download images for each games",
      format: Boolean,
      default: true
    }
  }
};
