import { takeBytes } from "@nxbm/utils";

export class NACPString {
  public check: number;
  public name: string;
  public developer: string;

  constructor(bytes: Buffer) {
    this.check = bytes[0];
    this.name = takeBytes()
      .from(bytes)
      .take(0x200)
      .toString()
      .replace(/\0/g, "");
    this.developer = takeBytes()
      .from(bytes)
      .skip(0x200)
      .take(0x100)
      .toString()
      .replace(/\0/g, "");
  }

  public toString() {
    return `NACP - String
    Check: ${this.check}
    Name: ${this.name}
    Developer: ${this.developer}`;
  }
}
