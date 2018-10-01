import { FileType } from "./file";

export interface NSPXmlResult {
  ContentMeta: NSPXML;
}

export enum NSPContentType {
  PROGRAM = "Program",
  LEGAL = "LegalInformation",
  CONTROL = "Control",
  META = "Meta",
  DATA = "Data"
}

export interface NSPXML {
  Type: FileType;
  Id: string;
  Version: string;
  RequiredDownloadSystemVersion: string;
  Content: NSPContent[];
  Digest: string;
  KeyGenerationMin: string;
  RequiredSystemVersion: string;
  PatchId: string;
}

export interface NSPContent {
  Type: string;
  Id: string;
  Size: string;
  Hash: string;
  KeyGeneration: string;
}
