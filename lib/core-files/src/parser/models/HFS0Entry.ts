import { read64LEFloat } from "@nxbm/utils";

import { FSEntry } from "./FSEntry";

export class HFS0Entry extends FSEntry {
  public padding: number;

  constructor(bytes: Buffer) {
    super(bytes);
    this.padding = read64LEFloat(bytes, 24);
  }
}
