import { takeBytes } from "../../../util/buffer";

export class NACPData {
  public version: string;
  public productId: string;

  constructor(bytes: Buffer) {
    this.version = takeBytes()
      .skip(0x60)
      .from(bytes)
      .take(16)
      .toString()
      .replace(/\0/g, "");

    const rawId = takeBytes()
      .skip(0xa8)
      .from(bytes)
      .take(8)
      .toString()
      .replace(/\0/g, "");

    this.productId = rawId || "N/A";
  }

  public toString() {
    return `NACP - Data
    Version: ${this.version}
    Prod: ${this.productId}`;
  }
}
