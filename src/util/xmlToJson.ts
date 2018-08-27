import { OptionsV2, parseString } from "xml2js";

export function parseXml<T>(
  xmlString: string,
  options: OptionsV2 = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    parseString(xmlString, options, (err, result) => {
      err ? reject(err) : resolve(result);
    });
  });
}
