import BlueBird from "bluebird";

import { Detail } from "../secure";
import { FSHeader, getFSHeaderBytes } from "./FSHeader";
import { HFS0Entry } from "./HFS0Entry";

export class HFS0Header extends FSHeader {
  public static async create(fd: number, offset?: number) {
    return new HFS0Header(await getFSHeaderBytes(fd, offset), fd);
  }

  public getHFS0Entries(offset: number) {
    return this.getFS0Entries(offset) as BlueBird<HFS0Entry[]>;
  }

  public async getSecurePartionDetails(secureStartOffset: number) {
    const entries = await this.getHFS0Entries(secureStartOffset);

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
