import { createLogger } from "@nxbm/core";
import * as Fuse from "fuse.js";

const defaultOptions: Fuse.FuseOptions<any> = {
  shouldSort: true,
  includeScore: true,
  threshold: 0.5,
  location: 0,
  distance: 100,
  maxPatternLength: 64,
  minMatchCharLength: 1
};

export interface FuseOptions extends Fuse.FuseOptions<any> {
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
  const fuse = new Fuse<T>(list, { ...defaultOptions, ...options } as any);
  return fuse.search(search);
}

export function findSingle<T>(list: T[], search: string, options: FuseOptions) {
  const log = createLogger("fuzzy");
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
  const log = createLogger("fuzzy");
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
