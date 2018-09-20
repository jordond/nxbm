import { takeBytes } from "@nxbm/utils";

export enum ContentType {
  META,
  PROGRAM,
  DATA,
  CONTROL,
  OFFLINE_MANUAL,
  LEGAL,
  GAME_UPDATE
}

export class CNMTEntry {
  public hash: Buffer;
  public rawNcaID: Buffer;
  public size: number;
  public rawType: number;
  public reserved: number;

  constructor(bytes: Buffer) {
    this.hash = takeBytes()
      .from(bytes)
      .take(32);
    this.rawNcaID = takeBytes()
      .skip(32)
      .from(bytes)
      .take(16);
    this.size = bytes.readInt32LE(48) + bytes.readInt16LE(52) * 65536;
    this.rawType = bytes[54];
    this.reserved = bytes[55];
  }

  public type = () => ContentType[this.rawType];

  public isTypeContent = () => this.rawType === ContentType.CONTROL;

  public ncaID = () => `${this.rawNcaID.toString("hex")}.nca`;

  public toString() {
    return `CNMT - Entry
    Hash: ${this.hash.toString("hex")}
    NCA ID: ${this.rawNcaID.toString("hex")}
            ${this.ncaID()}
    Size: ${this.size}
    Raw Type: ${this.rawType} -> ${this.type()}
    Reserved: ${this.reserved}`;
  }
}
