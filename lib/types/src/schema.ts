import { Schema } from "convict";
import { resolve } from "path";

import { LogLevel } from "./logger";

const root = resolve(__dirname);

export const schema: Schema<any> = {
  env: {
    doc: "The application environment.",
    format: ["production", "development", "test"],
    default: "production",
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
    downloadKeys: {
      doc: "Automatically download keys file if it cannot be found",
      format: Boolean,
      default: false,
      arg: "downloadKeys"
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
