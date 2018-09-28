import BlueBird from "bluebird";

import { Detail } from "../secure";
import { FSHeader, getFSHeaderBytes } from "./FSHeader";
import { HFS0Entry } from "./HFS0Entry";

export async function createHFS0Header(fd: number, offset?: number) {
  return new HFS0Header(await getFSHeaderBytes(fd, offset));
}

export class HFS0Header extends FSHeader {
  public getHFS0Entries(fd: number, offset: number) {
    return this.getFS0Entries(fd, offset) as BlueBird<HFS0Entry[]>;
  }

  public async getSecurePartionDetails(fd: number, secureStartOffset: number) {
    const entries = await this.getHFS0Entries(fd, secureStartOffset);

    // Iterate over the children in the secure partition and gather sizes and offsets
    return entries.map<Detail>(({ size, name, offset }) => ({
      size,
      name,
      offset: this.getSecureOffset(secureStartOffset + offset)
    }));
  }

  protected getEntryByteLength(): number {
    return 64;
  }

  protected createFSEntry(bytes: Buffer): HFS0Entry {
    return new HFS0Entry(bytes);
  }

  private getSecureOffset(offset: number) {
    return (
      offset +
      16 +
      this.stringTableSize +
      this.filecount * this.getEntryByteLength()
    );
  }
}
