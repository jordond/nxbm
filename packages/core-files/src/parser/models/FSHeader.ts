import { readByByte, readNBytes } from "@nxbm/utils";
import BlueBird, { map as mapPromise } from "bluebird";

import { FSEntry } from "./FSEntry";

export const MAX_FILECOUNT = 150;

export function getFSHeaderBytes(fd: number, offset: number = 0) {
  return readNBytes(fd, 16, offset);
}

export abstract class FSHeader {
  public magic: string;
  public filecount: number;
  public stringTableSize: number;
  public reserved: number;

  constructor(bytes: Buffer) {
    this.magic = bytes.toString("utf8", 0, 4);
    this.filecount = bytes.readInt32LE(4);
    this.stringTableSize = bytes.readInt32LE(8);
    this.reserved = bytes.readInt32LE(12);

    if (this.filecount > MAX_FILECOUNT) {
      // TODO - Research the impact of this, breaks XCI, needed for NSP?
      // this.filecount = MAX_FILECOUNT;
    }
  }

  public toString(type: string = "FS") {
    return `${type} - Header:
    Magic: ${this.magic}
    File Count: ${this.filecount}
    String Table Size: ${this.stringTableSize}
    Reserved: ${this.reserved}`;
  }

  protected abstract getEntryByteLength(): number;

  protected abstract createFSEntry(bytes: Buffer): FSEntry;

  protected getFS0Entries(
    fd: number,
    startOffset: number = 0
  ): BlueBird<FSEntry[]> {
    return mapPromise(Array(this.filecount), async (_, index) => {
      // Get entry
      const entryPosition = this.calcHFSOffset(startOffset, index);
      const entry = this.createFSEntry(
        await readNBytes(fd, this.getEntryByteLength(), entryPosition)
      );

      // Get name
      const namePosition =
        this.calcHFSOffset(startOffset, this.filecount) + entry.namePtr;
      const charName = await readByByte(fd, namePosition, num => num !== 0);
      entry.name = charName.toString();

      return entry;
    });
  }

  private calcHFSOffset(offset: number, additional?: number): number {
    return (
      offset +
      16 +
      this.getEntryByteLength() * (additional !== undefined ? additional : 1)
    );
  }
}
