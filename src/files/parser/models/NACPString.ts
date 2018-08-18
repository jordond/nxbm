import { takeBytes } from "../../../util/buffer";

export class NACPString {
  public name: string;
  public author: string;

  constructor(bytes: Buffer) {
    this.name = takeBytes()
      .from(bytes)
      .take(0x200)
      .toString();
    this.author = takeBytes()
      .from(bytes)
      .skip(0x200)
      .take(0x100)
      .toString();
  }
}
