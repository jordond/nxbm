import { File } from "../parser/models/File";

// TODO move to a d.ts file

export interface Release {
  id: string;
  name: string;
  publisher: string;
  region: string;
  languages: string;
  group: string;
  imagesize: string;
  serial: string;
  titleid: string;
  imgcrc: string;
  filename: string;
  releasename: string;
  trimmedsize: string;
  firmware: string;
  type: string;
  card: string;
}

export interface ParsedXml {
  releases: {
    release: Release[];
  };
}

export interface NSWDBCache {
  updatedAt?: Date;
  releases: Release[];
  find: (file: File) => Release | undefined;
}
