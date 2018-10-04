import { read64LEFloat } from "@nxbm/utils";

export abstract class FSEntry {
  public offset: number;
  public size: number;
  public namePtr: number;
  public name: string = "";

  constructor(bytes: Buffer) {
    this.offset = read64LEFloat(bytes, 0);
    this.size = read64LEFloat(bytes, 8);
    this.namePtr = bytes.readInt32LE(16);
  }

  public toString(type: string = "FS") {
    return `${type} - Entry:
    Offset: ${this.offset}
    Size: ${this.size}
    Name Pointer: ${this.namePtr}
    Name: ${this.name}`;
  }
}
