import stream from "stream";

export interface UploadStream extends stream.Readable {
  hapi: any;
}
