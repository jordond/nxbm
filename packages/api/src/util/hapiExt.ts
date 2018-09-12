import { Request } from "hapi";

export function hasQuery(r: Request, key: string): boolean {
  return Object.keys(r.query)
    .map(q => q.toLowerCase())
    .includes(key.toLowerCase());
}

export function getQuery<T>(r: Request, target: string): T | undefined {
  const key = Object.keys(r.query).find(
    x => x.toLowerCase() === target.toLowerCase()
  );

  return key ? ((r.query as any)[key] as T) : undefined;
}
