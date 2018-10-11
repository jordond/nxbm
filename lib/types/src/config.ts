import { ILogConfig } from "./logger";

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
  keys: string;
}

export interface IBackupConfig {
  folders: ScannerFolder[];
  watch: boolean;
  recursive: boolean;
  nswdb: INSWDBOptions;
  tgdb: ITGDBOptions;
  eshop: EShopDBOptions;
  autoInstallHactool: boolean;
  downloadKeys: boolean;
  removeBlacklisted: boolean;
  getDetailedInfo: boolean;
  downloadGameMedia: boolean;
}

export interface ScannerFolder {
  id: string;
  path: string;
  recursive?: boolean;
}

export interface INSWDBOptions {
  force?: boolean;
  refreshInterval?: number;
}

export interface ITGDBOptions {
  refreshInterval: number;
  apikey: string;
}

export interface EShopDBOptions {
  refreshInterval: number;
}
