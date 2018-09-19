import { read64LEFloat } from "../../../util/buffer";

export class FSEntry {
  public offset: number;
  public size: number;
  public namePtr: number;
  public padding: number;
  public name: string = "";

  constructor(bytes: Buffer) {
    this.offset = read64LEFloat(bytes, 0);
    this.size = read64LEFloat(bytes, 8);
    this.namePtr = bytes.readInt32LE(16);
    this.padding = read64LEFloat(bytes, 24);
  }

  public toString(type: string = "FS") {
    return `${type} - Entry:
    Offset: ${this.offset}
    Size: ${this.size}
    Name Pointer: ${this.namePtr}
    Padding: ${this.padding}
    Name: ${this.name}`;
  }
}
