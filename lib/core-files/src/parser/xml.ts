import { FileType, NSPXML, NSPXmlResult } from "@nxbm/types";
import { parseXml, readNBytes } from "@nxbm/utils";

import { PFS0Entry } from "./models/PFS0Entry";
import { PFS0Header } from "./models/PFS0Header";

export function findEntryXml(entries: PFS0Entry[]) {
  return entries.find(entry => entry.name.includes(".cnmt.xml"));
}

export async function extractXml(entry: PFS0Entry, header: PFS0Header) {
  const position = header.getEntryOffset(entry);
  const result = await readNBytes(header.fd, entry.size, position);
  const xmlResult = await parseXml<NSPXmlResult>(result.toString(), {
    explicitArray: false
  });

  return formatXml(xmlResult);
}

export function getBaseGameTitleId(xmlData: NSPXML): string {
  if (xmlData.Type === FileType.APPLICATION) {
    return xmlData.Id.toUpperCase();
  }

  let base = xmlData.Id.substr(0, 13);
  if (xmlData.Type === FileType.DLC) {
    const raw = parseInt(base, 16) - 1;
    base = `0${raw.toString(16)}`;
  }

  return `${base}000`.toUpperCase();
}

function formatXml({ ContentMeta }: NSPXmlResult): NSPXML {
  return {
    ...ContentMeta,
    Id: ContentMeta.Id.replace("0x", "").toUpperCase()
  };
}
