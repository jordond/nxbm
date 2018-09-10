import { Request } from "hapi";

export function hasQuery(r: Request, key: string): boolean {
  return Object.keys(r.query)
    .map(q => q.toLowerCase())
    .includes(key.toLowerCase());
}
