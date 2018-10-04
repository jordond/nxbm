export interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Take a object and maps its keys/values to query parameters
 * @example { limit: 5, branch: "develop" } => /builds?branch=develop&limit=5
 * @param opts - Query param object, branch is defaulted to master
 * @returns A string containing url encoded query params
 */
export function createQueryParams(opts: QueryParams = {}) {
  const params = Object.keys(opts)
    .filter(key => typeof opts[key] !== "undefined" && opts[key] !== null)
    .reduce(
      (prev: string[], key: string) => [
        ...prev,
        `${key}=${encodeURIComponent(opts[key] as any)}`
      ],
      []
    )
    .join("&");

  return params.length ? `?${params}` : "";
}

export function addQueryParams(url: string, opts?: QueryParams) {
  return `${url}${createQueryParams(opts)}`;
}
