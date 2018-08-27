export class FSHeader {
  public magic: string;
  public filecount: number;
  public stringTableSize: number;
  public reserved: number;

  constructor(bytes: Buffer) {
    this.magic = bytes.toString("utf8", 0, 4);
    this.filecount = bytes.readInt32LE(4);
    this.stringTableSize = bytes.readInt32LE(8);
    this.reserved = bytes.readInt32LE(12);
  }

  public toString(type: string = "FS") {
    return `${type} - Header:
    Magic: ${this.magic}
    File Count: ${this.filecount}
    String Table Size: ${this.stringTableSize}
    Reserved: ${this.reserved}`;
  }
}
