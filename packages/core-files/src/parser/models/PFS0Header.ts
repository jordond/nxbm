import BlueBird from "bluebird";

import { FSHeader, getFSHeaderBytes } from "./FSHeader";
import { PFS0Entry } from "./PFS0Entry";

export async function createPFS0Header(fd: number, offset?: number) {
  return new PFS0Header(await getFSHeaderBytes(fd, offset));
}

export class PFS0Header extends FSHeader {
  public isValid() {
    return this.magic === "PFS0";
  }

  public getPFS0Entries(fd: number) {
    return this.getFS0Entries(fd) as BlueBird<PFS0Entry[]>;
  }

  protected getEntryByteLength(): number {
    return 24;
  }

  protected createFSEntry(bytes: Buffer): PFS0Entry {
    return new PFS0Entry(bytes);
  }
}
