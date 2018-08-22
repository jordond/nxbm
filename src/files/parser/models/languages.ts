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
