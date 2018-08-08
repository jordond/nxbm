import { Request } from "hapi";

export function hasQuery(r: Request, key: string): boolean {
  return Object.keys(r.query).includes(key);
}
