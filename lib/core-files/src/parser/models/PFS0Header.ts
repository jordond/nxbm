import BlueBird from "bluebird";

import { FSHeader, getFSHeaderBytes } from "./FSHeader";
import { PFS0Entry } from "./PFS0Entry";

export class PFS0Header extends FSHeader {
  public static async create(fd: number, offset?: number) {
    return new PFS0Header(await getFSHeaderBytes(fd, offset), fd);
  }

  public isValid() {
    return this.magic === "PFS0";
  }

  public getPFS0Entries() {
    return this.getFS0Entries() as BlueBird<PFS0Entry[]>;
  }

  public getXmlOffset(entry: PFS0Entry) {
    return (
      16 +
      this.getEntryByteLength() * this.filecount +
      this.stringTableSize +
      entry.offset
    );
  }

  protected getEntryByteLength(): number {
    return 24;
  }

  protected createFSEntry(bytes: Buffer): PFS0Entry {
    return new PFS0Entry(bytes);
  }
}
