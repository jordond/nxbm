import { move, pathExists } from "fs-extra";
import { join, resolve } from "path";

import { getCacheDir } from "../../config";
import { IFile } from "./models/File";
import { NACPString } from "./models/NACPString";

export enum LANGUAGES {
  AMERICAN_ENGLISH = "American English",
  BRITISH_ENGLISH = "British English",
  JAPANESE = "Japanese",
  FRENCH = "French",
  GERMAN = "German",
  LATIN_AMERICAN_SPANISH = "Latin American Spanish",
  SPANISH = "Spanish",
  ITALIAN = "Italian",
  DUTCH = "Dutch",
  CANADIAN_FRENCH = "Canadian French",
  PORTUGUESE = "Portuguese",
  RUSSIAN = "Russian",
  KOREAN = "Korean",
  TAIWANESE = "Taiwanese", // This is Taiwanese but their titles comes in Traditional Chinese (http://blipretro.com/notes-on-the-taiwanese-nintendo-switch/)
  TRADITIONAL_CHINESE = "Traditional Chinese",
  UNKNOWN = "???"
}

export const NUMBER_OF_LANGUAGES = Object.keys(LANGUAGES).length;

export const LANGUAGES_ARRAY: string[] = Object.values(LANGUAGES);

export function getLangAt(index: number) {
  if (index < LANGUAGES_ARRAY.length) {
    return LANGUAGES_ARRAY[index];
  }
  return "";
}

export async function getLanguageData(
  nacpStrings: NACPString[],
  unpackDir: string,
  titleId: string
) {
  // Get the language and region data
  const promises = nacpStrings.map((_, index) =>
    createLanguageFilename(index, unpackDir, titleId)
  );

  const filenames = await Promise.all(promises);
  return moveLanguageFiles(filenames);
}

export interface LanguageIconData {
  input: string;
  out: string;
  language: string;
}

async function createLanguageFilename(
  index: number,
  unpackDir: string,
  titleId: string
): Promise<LanguageIconData> {
  const genInput = (x: string) =>
    resolve(unpackDir, `icon_${x.replace(/ /g, "")}.dat`);

  const shouldReplaceTai =
    index === 13 && (await pathExists(genInput(LANGUAGES.TAIWANESE)));
  const lang = (shouldReplaceTai
    ? LANGUAGES.TRADITIONAL_CHINESE
    : getLangAt(index)
  ).replace(/ /g, "");

  return {
    input: genInput(lang),
    out: join(getCacheDir(), "icons", titleId, `icon_${lang}.bmp`),
    language: getLangAt(index)
  };
}

async function moveLanguageFiles(paths: LanguageIconData[]) {
  const results: Partial<IFile> = {
    regionIcon: {},
    languages: []
  };
  for (const { input, out, language } of paths) {
    try {
      if (await pathExists(input)) {
        await move(input, out, { overwrite: true });
        results.regionIcon![language] = out;
        results.languages!.push(language);
      }
    } catch (error) {
      console.error(`couldnt move`);
      console.error(error);
    }
  }

  return results;
}
