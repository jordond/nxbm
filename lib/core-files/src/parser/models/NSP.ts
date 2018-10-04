import { FileType, IFile } from "@nxbm/types";

import { File } from "./File";

export class NSP extends File {
  constructor(opts: Partial<IFile> = {}) {
    super(FileType.NSP, opts);
  }
}
