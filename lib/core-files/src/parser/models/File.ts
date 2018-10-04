import {
  ContentType,
  FileType,
  GameUS,
  IFile,
  prettyContentType,
  Release,
  TGDBGame
} from "@nxbm/types";
import { fileSize, hexToGbStr } from "@nxbm/utils";
import { basename, extname } from "path";


export class File implements IFile {
  public type: FileType;
  public filepath = "";
  public totalSizeBytes = 0;
  public usedSizeBytes = 0;
  public titleIDRaw = 0;
  public titleIDBaseGame = "";
  public gameName = "";
  public developer = "";
  public gameRevision = "";
  public productCode = "";
  public sdkVersion = "";
  public rawCartSize = 0;
  public masterKeyRevisionRaw = -1;
  public languages = [];
  public sceneLanguages = [];
  public group = "";
  public serial = "";
  public firmware = "";
  public carttype = "";
  public region = "";
  public distributionType = "";
  public sceneID = 0;
  public contentType = ContentType.NONE;
  public version = "";
  public description = "";
  public rating = "";
  public youtube = "";
  public publisher = "";
  public releaseDate = "";
  public numberOfPlayers = "";
  public categories = [];
  public ESRB = 0;
  public media = {
    icons: {},
    artwork: {}
  };
  public eshop?: GameUS = undefined;

  public titleID: string = "";
  public masterKeyRevision: string = "";
  public extension: string = "";
  public filename: string = "";
  public filenameWithExt: string = "";
  public totalSize: string = "";
  public usedSize: string = "";
  public isTrimmed: boolean = false;
  public cartSize: string = "";

  public releaseDataSet: boolean = false;

  constructor(type: FileType, opts: Partial<IFile> = {}) {
    this.type = type;
    this.assign(opts);
  }

  public assign(
    opts?: Partial<IFile>,
    options: { whitelist: string[]; truthy: boolean } = {
      whitelist: [],
      truthy: false
    }
  ): File {
    if (!opts) {
      return this;
    }

    Object.keys(opts).forEach(key => {
      const value = (opts as any)[key];
      if (options.whitelist.includes(key) || (options.truthy && !value)) {
        return;
      }
      (this as any)[key] = value;
    });

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

    this.releaseDataSet = true;

    return this;
  }

  public assignTGDB(data: TGDBGame) {
    this.numberOfPlayers = data.players.toString();
    this.releaseDate = data.release_date;
    this.description = data.overview;
    this.rating = data.rating;
    this.youtube = data.youtube;
  }

  public id = () =>
    `${prettyContentType(this.contentType)}-${this.titleID}-${
      this.gameRevision
    }`;

  public displayName(): string {
    return `${this.gameName}:${this.id()}`;
  }

  public isNSP = () => this.type === FileType.NSP;

  public isXCI = () => this.type === FileType.XCI;

  public isDLC = () => this.isNSP() && this.contentType === ContentType.DLC;

  public toString() {
    return ` XCI Info:
    File Path: ${this.filepath}
    Filename: ${this.filename}
    Total Size: ${this.totalSize}
    Used Size: ${this.usedSize}
    Cart Size: ${this.cartSize}
    Is Trimmed: ${this.isTrimmed}
    Title ID: ${this.titleID}
    Title ID Base: ${this.titleIDBaseGame}
    MasterKey Rev: ${this.masterKeyRevision}
    SDK Version: ${this.sdkVersion}
    Version: ${this.version}
    Languages: [${this.languages}]
    Game Revision: ${this.gameRevision}
    Game Name: ${this.gameName}
    Developer: ${this.developer}`;
  }
}
