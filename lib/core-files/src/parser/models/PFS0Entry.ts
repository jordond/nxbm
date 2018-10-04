import { read64LEFloat } from "@nxbm/utils";

import { FSEntry } from "./FSEntry";

export class PFS0Entry extends FSEntry {
  public reserved: number;

  constructor(bytes: Buffer) {
    super(bytes);
    this.reserved = read64LEFloat(bytes, 20);
  }
}
