import { read64LEFloat, takeBytes } from "../../../util/buffer";

export enum TitleType {
  SYSTEM_PROGRAMS = 0x01,
  SYSTEM_DATA_ARCHIVES,
  SYSTEM_UPDATE,
  FIRMWARE_PACKAGE_A,
  FIRMWARE_PACKAGE_B,
  REGULAR_APPLICATION = 0x80,
  UPDATE_TITLE,
  ADD_ON_CONTENT,
  DELTA_TITLE
}

export class CNMTHeader {
  public titleID: number;
  public titleVersion: number;
  public rawType: number;
  public reserved1: number;
  public offset: number;
  public contentCount: number;
  public metaCount: number;
  public reserved2: Buffer;

  constructor(bytes: Buffer) {
    this.titleID = read64LEFloat(bytes);
    this.titleVersion = bytes.readInt32LE(8);
    this.rawType = bytes[12];
    this.reserved1 = bytes[13];
    this.offset = bytes.readInt16LE(14);
    this.contentCount = bytes.readInt16LE(16);
    this.metaCount = bytes.readInt16LE(16);
    this.reserved2 = takeBytes()
      .skip(20)
      .from(bytes)
      .take(12);
  }

  public toString() {
    return `CNMT - Header:
    Title ID: ${this.titleID}
    Title Version: ${this.titleVersion}
    Raw Type: ${this.rawType}
    Reserved1: ${this.reserved1}
    Offset: ${this.offset}
    Content Count: ${this.contentCount}
    Meta Count: ${this.metaCount}
    Reserved2: ${this.reserved2.toString("hex")}`;
  }
}
