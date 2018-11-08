import stream from "stream";

export interface UploadStream extends stream.Readable {
  hapi: {
    filename: string;
    headers: {
      [key: string]: any;
    };
  };
}

export interface UploadGamePayloadStream {
  destinationFolder: string;
  files: UploadStream | UploadStream[];
}
