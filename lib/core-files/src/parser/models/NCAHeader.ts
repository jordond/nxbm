import { formatTitleId, read64LEFloat } from "@nxbm/utils";

export class NCAHeader {
  public magic: string;
  public rawTitleID: number;
  public sdkVersion1: number;
  public sdkVersion2: number;
  public sdkVersion3: number;
  public sdkVersion4: number;
  public masterKeyRev: number;

  constructor(bytes: Buffer) {
    this.magic = bytes.toString("utf8", 512, 516);
    this.rawTitleID = read64LEFloat(bytes, 528);
    this.sdkVersion1 = bytes[540];
    this.sdkVersion2 = bytes[541];
    this.sdkVersion3 = bytes[542];
    this.sdkVersion4 = bytes[543];
    this.masterKeyRev = bytes[544];
  }

  public titleId = () => formatTitleId(this.rawTitleID);

  public formatSDKVersion() {
    return [
      this.sdkVersion4,
      this.sdkVersion3,
      this.sdkVersion2,
      this.sdkVersion1
    ].join(".");
  }

  public toString() {
    return `NCA - Header:
    Magic: ${this.magic}
    Title ID: ${this.rawTitleID}
              ${this.titleId()}
    SDK Version 1: ${this.sdkVersion1}
    SDK Version 2: ${this.sdkVersion2}
    SDK Version 3: ${this.sdkVersion3}
    SDK Version 4: ${this.sdkVersion4}
    Master Key Rev: ${this.masterKeyRev}`;
  }
}
