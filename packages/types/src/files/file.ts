import { GameUS } from "./eshop";
import { TGDBGameImages } from "./tgdb";

// TODO - Rename this to File, and IFile to Game
export interface Game {
  file: File;
  added: Date;
  missing?: boolean;
  blacklist?: boolean;
}

export interface IFile {
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
  contentType: string;
  version: string;
  description: string;
  rating: string;
  youtube: string;
  publisher: string;
  releaseDate: string;
  numberOfPlayers: string;
  categories: string[];
  ESRB: number;
  media: FileMedia;
  eshop?: GameUS;
}

export interface FileMedia {
  icons?: {
    [key: string]: string;
  };
  artwork?: TGDBGameImages;
}
