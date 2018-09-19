import * as Fuse from "fuse.js";

import { create } from "../logger";

const defaultOptions: Fuse.FuseOptions = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
  maxPatternLength: 64,
  minMatchCharLength: 1
};

export interface FuseOptions extends Fuse.FuseOptions {
  keys: string[];
  threshold?: number;
}

export interface FuseResult {
  score: number;
  [name: string]: any;
}

export function matchString<T>(
  list: any[],
  search: string,
  options: FuseOptions
) {
  const fuse = new Fuse(list, { ...defaultOptions, ...options });
  return fuse.search<T>(search);
}

export function findSingle<T>(list: T[], search: string, options: FuseOptions) {
  const log = create("fuzzy");
  const matches = matchString(list, search, options) as FuseResult[];

  if (!matches[0]) {
    log.debug(`No matches found`);
    return;
  }

  const { score, ...result } = matches[0];
  const thresh = options.threshold || 0.05;
  log.debug(
    `Search ${search} had a scrore of ${score}  with thresh of ${thresh}`
  );
  if ((score === 0 || score < thresh) && result) {
    return result.item as T;
  }
}

export function findMultiple<T>(
  list: T[],
  search: string,
  options: FuseOptions
) {
  const log = create("fuzzy");
  const result = matchString(list, search, options) as FuseResult[];

  const thresh = options.threshold || 0.05;

  log.debug(`Search: ${search}, thresh -> ${thresh}`);
  return result
    .filter(res => {
      log.silly(`-> score: ${res.score}`);
      return res.score <= thresh;
    })
    .map(res => res.item as T);
}
