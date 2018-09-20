import { hexToGbStr, read64LEFloat } from "@nxbm/utils";

export class XCIHeader {
  public magic: string;
  public cardSize1: number;
  public cardSize2: number;
  public hfs0Offset: number;
  public hfs0Size: number;

  constructor(bytes: Buffer) {
    this.magic = bytes.toString("utf8", 256, 260);
    this.cardSize1 = bytes[269];
    this.cardSize2 = read64LEFloat(bytes, 280);
    this.hfs0Offset = read64LEFloat(bytes, 304);
    this.hfs0Size = read64LEFloat(bytes, 312);
  }

  public toString() {
    return `XCI:
    Magic: ${this.magic}
    Card Size: 0x${this.cardSize1.toString(16)} -> ${
      this.cardSize1
    } => ${hexToGbStr(this.cardSize1)}
    Card Size2: ${this.cardSize2}
    HFS0 Offset: ${this.hfs0Offset}
    HFS0 Size: ${this.hfs0Size}`;
  }
}
