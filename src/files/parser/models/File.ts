import { basename, extname } from "path";
import { fileSize, formatTitleId, hexToGbStr } from "../../../util/parser";
import { Release } from "../../nswdb.types";
import { getMasterKeyStr } from "../masterkey";

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
  regionIcon: {
    [key: string]: string;
  };
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
  publisher: string;
  releaseDate: string;
  numberOfPlayers: string;
  categories: string[];
  ESRB: number;
}

export class File implements IFile {
  public filepath = "";
  public totalSizeBytes = 0;
  public usedSizeBytes = 0;
  public titleIDRaw = 0;
  public gameName = "";
  public developer = "";
  public gameRevision = "";
  public productCode = "";
  public sdkVersion = "";
  public rawCartSize = 0;
  public masterKeyRevisionRaw = -1;
  public regionIcon = {};
  public languages = [];
  public sceneLanguages = [];
  public group = "";
  public serial = "";
  public firmware = "";
  public carttype = "";
  public region = "";
  public distributionType = "";
  public sceneID = 0;
  public contentType = "";
  public version = "";
  public description = "";
  public publisher = "";
  public releaseDate = "";
  public numberOfPlayers = "";
  public categories = [];
  public ESRB = 0;

  public titleID: string = "";
  public masterKeyRevision: string = "";
  public extension: string = "";
  public filename: string = "";
  public filenameWithExt: string = "";
  public totalSize: string = "";
  public usedSize: string = "";
  public isTrimmed: boolean = false;
  public cartSize: string = "";

  public release?: Release;

  constructor(opts: Partial<IFile> = {}) {
    this.assign(opts);
  }

  public assign(opts?: Partial<IFile>): File {
    if (!opts) {
      return this;
    }

    Object.keys(opts).forEach(key => ((this as any)[key] = (opts as any)[key]));

    this.titleID = formatTitleId(this.titleIDRaw);
    this.masterKeyRevision = getMasterKeyStr(this.masterKeyRevisionRaw);
    this.extension = extname(this.filepath);
    this.filename = basename(this.filepath, this.extension);
    this.filenameWithExt = basename(this.filepath);
    this.totalSize = fileSize(this.totalSizeBytes, false);
    this.usedSize = fileSize(this.usedSizeBytes, false);
    this.isTrimmed = this.usedSizeBytes === this.totalSizeBytes;
    this.cartSize = hexToGbStr(this.rawCartSize);

    return this;
  }

  public assignRelease(release?: Release) {
    if (!release) {
      return this;
    }

    const {
      name,
      group,
      serial,
      firmware,
      card,
      region,
      languages,
      id
    } = release;

    this.assign({
      group,
      serial,
      firmware,
      region,
      gameName: name,
      carttype: card,
      sceneLanguages: languages.split(","),
      sceneID: parseInt(id),
      version: firmware.toLowerCase()
    });

    return this;
  }

  public id(): string {
    return `${this.titleID}-${this.gameRevision}`;
  }

  public displayName(): string {
    return `${this.gameName}:${this.id()}`;
  }

  public toString() {
    return ` XCI Info:
    File Path: ${this.filepath}
    Filename: ${this.filename}
    Total Size: ${this.totalSize}
    Used Size: ${this.usedSize}
    Cart Size: ${this.cartSize}
    Is Trimmed: ${this.isTrimmed}
    Title ID: ${this.titleID}
    MasterKey Rev: ${this.masterKeyRevision}
    SDK Version: ${this.sdkVersion}
    Version: ${this.version}
    Languages: [${this.languages}]
    Game Revision: ${this.gameRevision}
    Game Name: ${this.gameName}
    Developer: ${this.developer}`;
  }
}
