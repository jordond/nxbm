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

  public release?: Release;

  constructor(opts: Partial<IFile> = {}) {
    this.assign(opts);
  }

  public assign(opts: Partial<IFile>) {
    Object.keys(opts).forEach(key => ((this as any)[key] = (opts as any)[key]));
  }

  public extension = () => extname(this.filepath);
  public filename = () => basename(this.filepath, this.extension());
  public filenameWithExt = () => basename(this.filepath);

  public totalSize = (useSI = true) => fileSize(this.totalSizeBytes, useSI);
  public usedSize = (useSI = true) => fileSize(this.usedSizeBytes, useSI);
  public isTrimmed = () => this.usedSizeBytes === this.totalSizeBytes;
  public cartSize = () => hexToGbStr(this.rawCartSize);

  public titleID = () => formatTitleId(this.titleIDRaw);
  public masterKeyRevision = () => getMasterKeyStr(this.masterKeyRevisionRaw);

  public toString() {
    return ` XCI Info:
    File Path: ${this.filepath}
    Filename: ${this.filename()}
    Total Size: ${this.totalSize()}
    Used Size: ${this.usedSize()}
    Cart Size: ${this.cartSize()}
    Is Trimmed: ${this.isTrimmed()}
    Title ID: ${this.titleID()}
    MasterKey Rev: ${this.masterKeyRevision()}
    SDK Version: ${this.sdkVersion}
    Version: ${this.version}`;
  }
}
