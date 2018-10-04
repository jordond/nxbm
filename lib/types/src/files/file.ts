import { GameUS } from "./eshop";
import { Release } from "./nswdb";
import { TGDBGame, TGDBGameImages } from "./tgdb";

// TODO - Rename this to File, and IFile to Game
export interface Game {
  file: IFile;
  added: Date;
  missing?: boolean;
  blacklist?: boolean;
}

export enum ContentType {
  APPLICATION = "Application",
  UPDATE = "Patch",
  DLC = "AddOnContent",
  UNKNOWN = "Unknown",
  NONE = ""
}

export function prettyContentType(type: ContentType) {
  switch (type) {
    case ContentType.APPLICATION:
      return "APP";
    case ContentType.UPDATE:
      return "UPDATE";
    case ContentType.DLC:
      return "DLC";
    default:
      return "unknown";
  }
}

export interface IGameDBData {
  games: Map<string, Game>;
}

export interface IGameDB extends IGameDBData {
  save: () => Promise<boolean>;
  load: () => Promise<boolean>;
  dbPath: () => string;
  find: (game?: IFile) => undefined | Game;
  findByID: (titleID: string) => Game[];
  findByFileName: (filename: string) => undefined | Game;
  has: (game: IFile) => boolean;
  add: (file: IFile) => Promise<Game>;
  update: (file: IFile) => Promise<void>;
  markMissing: (game: Game) => boolean;
  remove: (game: Game) => void;
  check: (removeOnBlacklist: boolean) => Promise<void>;
}

export interface IFileData {
  type: FileType;
  filepath: string;
  totalSizeBytes: number;
  usedSizeBytes: number;
  titleIDRaw: number;
  gameName: string;
  developer: string;
  gameRevision: string;
  productCode: string;
  sdkVersion: string;
  rawCartSize: number;
  masterKeyRevisionRaw: number;
  languages: string[];
  sceneLanguages: string[];
  group: string;
  serial: string;
  firmware: string;
  carttype: string;
  region: string;
  distributionType: string;
  sceneID: number;
  contentType: ContentType;
  version: string;
  publisher: string;
  categories: string[];
  ESRB: number;
  media: FileMedia;

  eshop?: GameUS;
  extras?: FileTGDBData;

  titleID: string;
  titleIDBaseGame: string;
  masterKeyRevision: string;
  extension: string;
  filename: string;
  filenameWithExt: string;
  totalSize: string;
  usedSize: string;
  isTrimmed: boolean;
  cartSize: string;
  releaseDataSet: boolean;
}

export enum FileType {
  XCI = "xci",
  NSP = "nsp"
}

export interface IFile extends IFileData {
  assign: (
    data: Partial<IFile>,
    options?: { whitelist: string[]; truthy: boolean }
  ) => IFile;
  assignRelease: (release?: Release) => IFile;
  assignTGDB: (data: TGDBGame) => void;
  id: () => string;
  displayName: () => string;
  isNSP: () => boolean;
  isXCI: () => boolean;
  isDLC: () => boolean;
}

export interface FileMedia {
  icons?: {
    [key: string]: string;
  };
  artwork?: TGDBGameImages;
}

export interface FileTGDBData {
  numberOfPlayers: string;
  releaseDate: string;
  description: string;
  rating: string;
  youtube: string;
}
