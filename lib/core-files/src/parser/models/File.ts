import { GameUS, IFile, Release, TGDBGame } from "@nxbm/types";
import { fileSize, formatTitleId, hexToGbStr } from "@nxbm/utils";
import { basename, extname } from "path";

import { getMasterKeyStr } from "../masterkey";

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
