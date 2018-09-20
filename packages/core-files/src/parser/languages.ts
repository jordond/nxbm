import { findFilesByName, removeDuplicates } from "@nxbm/utils";
import { map } from "bluebird";
import { move, pathExists } from "fs-extra";
import { basename, join } from "path";

export enum LANGUAGE {
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
  SIMPLIFIED_CHINESE = "Simplified Chinese",
  UNKNOWN = "?"
}

export const NUMBER_OF_LANGUAGES = Object.keys(LANGUAGE).length;

export const LANGUAGES_ARRAY: string[] = Object.values(LANGUAGE);

export const LANGUAGE_MAP = generateLanguageMap();

export interface LanguageIconData {
  iconPath: string;
  language: string;
}

export function findLanguageFromPath(path: string): LANGUAGE {
  const foundStringIndex = LANGUAGE_MAP[getLanguageFromFilePath(path)];
  return foundStringIndex >= 0
    ? getLanguageAt(foundStringIndex)
    : LANGUAGE.UNKNOWN;
}

/**
 * Get the game icons and languages
 *
 * @param romFSDir Directory path to where the romFS was unpacked
 * @param titleId TitleID of the current game
 */
export async function getRomFSLanguageAndIcons(
  romFSDir: string
): Promise<LanguageIconData[]> {
  const iconPaths = await findFilesByName(romFSDir, "icon_*.dat");

  return iconPaths.map(path => ({
    iconPath: path,
    language: findLanguageFromPath(path)
  }));
}

export function getUniqueLanguages(
  left: LanguageIconData[],
  right: LanguageIconData[]
) {
  return removeDuplicates<LanguageIconData>([...left, ...right], "language");
}

export interface MoveIconOptions {
  input: string;
  output: string;
}

export function createMoveIconOptions(
  icons: string[],
  outDir: string,
  titleId: string
): MoveIconOptions[] {
  return icons.map(icon => ({
    input: icon,
    output: createIconFilename(titleId, outDir, icon)
  }));
}

export async function moveLanguageFiles(icons: MoveIconOptions[]) {
  return map(icons, async ({ input, output }) => {
    try {
      if (await pathExists(input)) {
        await move(input, output, { overwrite: true });
        return output;
      }

      console.log(`doesnt exist: ${input}`);
    } catch (error) {
      console.error(`couldnt move`);
      console.error(error);
    }

    return "";
  }).filter(moved => moved !== "");
}

export function getLanguageFromFilePath(filePath: string): string {
  return basename(filePath)
    .replace(/\.(dat|bmp)/, "")
    .replace("icon_", "");
}

function createIconFilename(titleId: string, outDir: string, iconPath: string) {
  return join(
    outDir,
    titleId,
    "icons",
    `icon_${getLanguageFromFilePath(iconPath)}.bmp`
  );
}

function generateLanguageMap(): { [lang: string]: number } {
  return LANGUAGES_ARRAY.map(x => x.replace(/ /g, "")).reduce(
    (prev, curr, index) => ({ ...prev, [curr]: index }),
    {}
  );
}

function getLanguageAt(index: number): LANGUAGE {
  return LANGUAGES_ARRAY[index] as LANGUAGE;
}
