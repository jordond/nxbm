import { FileType, IFile } from "@nxbm/types";

import { File } from "./File";

export class XCI extends File {
  constructor(opts: Partial<IFile> = {}) {
    super(FileType.XCI, opts);
  }
}
