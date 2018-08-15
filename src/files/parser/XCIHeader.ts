import { read64LEFloat } from "../../util/buffer";

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
    } => ${this.hexToGb(this.cardSize1, true)}
    Card Size2: ${this.cardSize2}
    HFS0 Offset: ${this.hfs0Offset}
    HFS0 Size: ${this.hfs0Size}`;
  }

  public hexToGb(hex: number, isStr = false): string | number {
    const conv = () => {
      switch (hex) {
        case 0xfa:
          return 1;
        case 0xf8:
          return 2;
        case 0xf0:
          return 4;
        case 0xe0:
          return 8;
        case 0xe1:
          return 16;
        case 0xe2:
          return 32;
        default:
          return 0;
      }
    };

    const val = conv();
    return isStr ? `${val}GB` : val;
  }
}
