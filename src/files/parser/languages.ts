import { move, pathExists } from "fs-extra";
import { basename, join, resolve } from "path";

import { mapSeries } from "bluebird";
import { getCacheDir } from "../../config";
import { findFilesByName } from "../../util/filesystem";
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
  // Get a list of icon filepaths
  const iconPaths = await findFilesByName(unpackDir, "icon_*.dat");

  // Create list of languages: [AmericanEnglish,Spanish, etc]
  const languages: LanguageIconData[] = iconPaths.map(path => ({
    input: path,
    language: getLanguageFromFilePath(path),
    out: ""
  }));

  // Generate input and output paths for each language

  // Generate region icon: {[language]: "filepath/to/icon.bmp"}
  // and languages: ["American English", "Spanish"]

  // Get the language and region data
  const languageDetails = await mapSeries(nacpStrings, (_, index) =>
    createLanguageFilename(index, unpackDir, titleId)
  );
}

function getLanguageFromFilePath(filePath: string): string {
  return basename(filePath, ".dat").replace("icon_", "");
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
      } else {
        console.log(`doesnt exist: ${input}`);
      }
    } catch (error) {
      console.error(`couldnt move`);
      console.error(error);
    }
  }

  return results;
}
